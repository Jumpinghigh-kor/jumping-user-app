import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonPopup from '../components/CommonPopup';
import {updateMemberAppPassword} from '../api/services/membersService';
import CommonHeader from '../components/CommonHeader';

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const PasswordChange = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'default' | 'warning' | 'confirm'>('warning');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const validatePassword = (password: string): boolean => {
    // 비밀번호는 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 함
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = (): boolean => {
    const newErrors: PasswordErrors = {};
    let isValid = true;

    if (!currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요.';
      isValid = false;
    }

    if (!validatePassword(newPassword)) {
      newErrors.newPassword = '비밀번호는 대소문자, 숫자, 특수문자를 포함한 8자리 이상이어야 합니다.';
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '새 비밀번호와 일치하지 않습니다.';
      isValid = false;
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = '현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    if (loading) return;
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // mem_id 가져오기
      const memId = await AsyncStorage.getItem('mem_id');
      
      // API 호출
      const response = await updateMemberAppPassword({
        mem_id: parseInt(memId, 10),
        mem_app_password: newPassword, // 새 비밀번호 전송
        current_password: currentPassword, // 현재 비밀번호도 전송
      });
      
      if (response.success) {
        // 비밀번호 변경 성공 시 메시지 표시
        setPopupMessage('비밀번호가 변경되었습니다.');
        setPopupType('default');
        setPopupVisible(true);
        
        // 입력값 초기화
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
      } else {
        // 현재 비밀번호가 맞지 않는 경우에 대한 처리
        if (response.message) {
          setPopupMessage('현재 비밀번호가 맞지 않습니다.');
          setPopupType('warning');
          setPopupVisible(true);
        } else {
          setPopupMessage(response.message || '비밀번호 변경에 실패했습니다.');
          setPopupType('warning');
          setPopupVisible(true);
        }
      }
    } catch (error) {
      setPopupMessage('비밀번호 변경 중 오류가 발생했습니다.');
      setPopupType('warning');
      setPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePopupConfirm = () => {
    setPopupVisible(false);
    
    // 성공했을 때만 뒤로 가기
    if (popupType === 'default') {
      navigation.goBack();
    }
  };

  const toggleShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <>
      <CommonHeader title="비밀번호 변경" />
      <View style={styles.container}>
        <View style={{flexGrow: 1}}>
          <View style={styles.formGroup}>
            <Text style={styles.desc}>주기적으로 비밀번호를 변경하는 것이 안전합니다.{'\n'}<Text style={{color: '#F04D4D'}}>새로운 비밀번호</Text>를 입력해 주세요.</Text>
            <Text style={styles.label}>현재 비밀번호</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="현재 비밀번호를 입력해 주세요."
                placeholderTextColor="#373737"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={toggleShowCurrentPassword}
              >
                <Image 
                  source={showCurrentPassword ? IMAGES.icons.invisibleGray : IMAGES.icons.visibleGray} 
                  style={styles.eyeIconImage}
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            )}

            <Text style={[styles.label, {marginTop: scale(40)}]}>새로운 비밀번호</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="새로운 비밀번호를 입력해 주세요."
                placeholderTextColor="#373737"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={toggleShowNewPassword}
              >
                <Image 
                  source={showNewPassword ? IMAGES.icons.invisibleGray : IMAGES.icons.visibleGray} 
                  style={styles.eyeIconImage}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : (
              <Text style={styles.helperText}>
                대소문자+숫자+특수분자 8자리 이상
              </Text>
            )}

            <Text style={[styles.label, {marginTop: scale(40)}]}>비밀번호 확인</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="새로운 비밀번호를 다시 입력해 주세요."
                placeholderTextColor="#373737"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={toggleShowConfirmPassword}
              >
                <Image 
                  source={showConfirmPassword ? IMAGES.icons.invisibleGray : IMAGES.icons.visibleGray} 
                  style={styles.eyeIconImage}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || !currentPassword || !newPassword || !confirmPassword) && styles.disabledButton
          ]}
          onPress={handleChangePassword}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        >
          <Text style={styles.submitButtonText}>비밀번호 변경</Text>
        </TouchableOpacity>

        <CommonPopup
          visible={popupVisible}
          message={popupMessage}
          type={popupType}
          onConfirm={handlePopupConfirm}
          confirmText="확인"
        />

      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    paddingHorizontal: scale(12),
  },
  desc: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginTop: scale(20),
    marginBottom: scale(30),
  },
  formGroup: {
    marginBottom: scale(20),
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(14),
    marginBottom: scale(8),
    fontWeight: 'bold',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  input: {
    flex: 1,
    paddingVertical: scale(12),
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  eyeIcon: {
    padding: scale(5),
    marginLeft: scale(10),
  },
  eyeIconImage: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#F04D4D',
    fontSize: scale(10),
    marginTop: scale(4),
  },
  helperText: {
    color: '#B4B4B4',
    fontSize: scale(10),
    marginTop: scale(4),
  },
  submitButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(40),
    paddingVertical: scale(12),
  },
  disabledButton: {
    backgroundColor: '#848484',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
});

export default PasswordChange; 