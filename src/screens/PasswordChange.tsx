import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const validatePassword = (password: string): boolean => {
    // 비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 함
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
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
      newErrors.newPassword = '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.';
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.';
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
      
      if (!memId) {
        Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      
      // API 호출
      const response = await updateMemberAppPassword({
        mem_id: parseInt(memId, 10),
        mem_app_password: newPassword, // 새 비밀번호 전송
      });
      
      if (response.success) {
        // 비밀번호 변경 성공 시 메시지 표시
        setPopupMessage('비밀번호가 변경되었습니다.');
        setPopupVisible(true);
        
        // 입력값 초기화
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
      } else {
        Alert.alert('오류', response.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 에러:', error);
      Alert.alert('오류', '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePopupConfirm = () => {
    setPopupVisible(false);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Image source={IMAGES.icons.arrowLeftWhite} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>비밀번호 변경</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>현재 비밀번호</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.currentPassword && styles.inputError]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="현재 비밀번호 입력"
              placeholderTextColor="#999999"
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={toggleShowCurrentPassword}
            >
              <Text style={styles.eyeText}>{showCurrentPassword ? '숨기기' : '보기'}</Text>
            </TouchableOpacity>
          </View>
          {errors.currentPassword && (
            <Text style={styles.errorText}>{errors.currentPassword}</Text>
          )}

          <Text style={[styles.label, {marginTop: scale(20)}]}>새 비밀번호</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.newPassword && styles.inputError]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="새 비밀번호 입력"
              placeholderTextColor="#999999"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={toggleShowNewPassword}
            >
              <Text style={styles.eyeText}>{showNewPassword ? '숨기기' : '보기'}</Text>
            </TouchableOpacity>
          </View>
          {errors.newPassword ? (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          ) : (
            <Text style={styles.helperText}>
              비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.
            </Text>
          )}

          <Text style={[styles.label, {marginTop: scale(20)}]}>새 비밀번호 확인</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="새 비밀번호 확인"
              placeholderTextColor="#999999"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={toggleShowConfirmPassword}
            >
              <Text style={styles.eyeText}>{showConfirmPassword ? '숨기기' : '보기'}</Text>
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>비밀번호 변경</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CommonPopup
        visible={popupVisible}
        message={popupMessage}
        onConfirm={handlePopupConfirm}
        confirmText="확인"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 0,
    borderBottomColor: '#333333',
    backgroundColor: '#202020',
    marginTop: scale(5),
  },
  backButton: {
    width: scale(30),
    height: scale(30),
    justifyContent: 'center',
  },
  backIcon: {
    width: scale(20),
    height: scale(20),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  headerRight: {
    width: scale(40),
  },
  contentContainer: {
    flex: 1,
    padding: scale(16),
  },
  formGroup: {
    marginBottom: scale(20),
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginBottom: scale(8),
    fontWeight: 'bold',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(12),
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  eyeIcon: {
    position: 'absolute',
    right: scale(10),
    padding: scale(5),
  },
  eyeText: {
    color: '#43B546',
    fontSize: scale(10),
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: scale(10),
    marginTop: scale(4),
  },
  helperText: {
    color: '#999999',
    fontSize: scale(10),
    marginTop: scale(4),
  },
  submitButton: {
    backgroundColor: '#43B546',
    height: scale(50),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(20),
    marginBottom: scale(40),
  },
  disabledButton: {
    backgroundColor: '#666666',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
});

export default PasswordChange; 