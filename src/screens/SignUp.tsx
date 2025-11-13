import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, CommonActions, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import ProfileImagePicker from '../components/ProfileImagePicker';
import CommonHeader from '../components/CommonHeader';
import CommonModal from '../components/CommonModal';
import IMAGES from '../utils/images';
import { checkNicknameDuplicate, completeSignup } from '../api/services/membersService';
import CommonPopup from '../components/CommonPopup';
import {privacyPolicyText, termsOfServiceText} from '../constants/termsData';
import { useAuth } from '../hooks/useAuth';
import { useProfileImage } from '../hooks/useProfileImage';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  MainTab: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignUp = () => {
  const navigation = useNavigation<NavigationProp>();
  const { memberInfo, loadMemberInfo } = useAuth();
  const { profileImageUrl, loadProfileImage } = useProfileImage(memberInfo?.mem_id);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [showAgreementPopup, setShowAgreementPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreements, setAgreements] = useState({
    all: false,
    age: false,
    terms: false,
    privacy: false,
    marketing: false,
  });

  useFocusEffect(
    React.useCallback(() => {
      loadMemberInfo();
      loadProfileImage();
    }, [memberInfo?.mem_id]),
  );

  const handleGoBack = () => {
    navigation.dispatch(CommonActions.navigate({name: 'Login'}));
  };

  const showModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalVisible(true);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorPopup(true);
  };

  const handleSignUp = async () => {
    if (!nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }

    // 필수 약관 동의 체크
    if (!agreements.age || !agreements.terms || !agreements.privacy) {
      setShowAgreementPopup(true);
      return;
    }

    try {
      setIsSubmitting(true);
      // 닉네임 중복 확인
      const nicknameResponse = await checkNicknameDuplicate(nickname);
      
      if (!nicknameResponse.success) {
        setNicknameError('이미 사용 중인 닉네임입니다.');
        setIsSubmitting(false);
        return;
      }

      // 회원가입 완료 처리
      if (memberInfo?.mem_id) {
        const response = await completeSignup(memberInfo.mem_id, nickname);
        if (response.success) {
          // 회원가입 성공 처리
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainTab' }],
            })
          );
        } else {
          showError('회원가입 처리 중 오류가 발생했습니다.');
        }
      } else {
        showError('회원 정보를 찾을 수 없습니다.');
      }
    } catch (error: any) {
      showError('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAgreement = (key: keyof typeof agreements) => {
    if (key === 'all') {
      const newAllValue = !agreements.all;
      setAgreements({
        all: newAllValue,
        age: newAllValue,
        terms: newAllValue,
        privacy: newAllValue,
        marketing: newAllValue,
      });
    } else {
      setAgreements(prev => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <CommonHeader onBackPress={handleGoBack} title="" />
      <View style={styles.container}>
        <Text style={styles.title}>닉네임을{'\n'}입력해주세요</Text>
        <View style={styles.profileSection}>
          <ProfileImagePicker
            memId={memberInfo?.mem_id}
            currentImageUrl={profileImageUrl}
            onImageUpdate={loadProfileImage}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={(text) => {
                setNickname(text);
                setNicknameError('');
              }}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor="#848484"
              maxLength={10}
              editable={!isSubmitting}
            />
            <Text style={styles.characterCount}>{nickname.length}/10</Text>
          </View>
          <View style={styles.underline} />
          <View style={styles.errorContainer}>
            {nicknameError ? <Text style={styles.errorText}>{nicknameError}</Text> : null}
          </View>
          <View>
            <Text style={styles.agreementTitle}>서비스 이용을 위해 약관을 동의해주세요</Text>
            <Text style={styles.agreementDescription}>회원님의 개인정보와 서비스 이용 권리를 지켜드릴게요</Text>
            
            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => toggleAgreement('all')}
              disabled={isSubmitting}
            >
              <Image 
                source={agreements.all ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} 
                style={styles.checkbox} 
              />
              <View style={styles.agreementTextContainer}>
                <Text style={styles.allCheckboxText}>모두 동의</Text>
                <Text style={styles.agreementDescription}>서비스 이용을 위해 아래 약관에 모두 동의합니다.</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.areementUnderline} />

            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => toggleAgreement('age')}
              disabled={isSubmitting}
            >
              <Image 
                source={agreements.age ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} 
                style={styles.checkbox} 
              />
              <Text style={styles.checkboxText}>[필수] 만 14세 이상입니다.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => toggleAgreement('terms')}
              disabled={isSubmitting}
            >
              <Image 
                source={agreements.terms ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} 
                style={styles.checkbox} 
              />
              <Text style={styles.checkboxText}>[필수] 서비스 이용약관</Text>
              <TouchableOpacity 
                onPress={() => showModal('이용약관', termsOfServiceText)}
                disabled={isSubmitting}
              >
                <Text style={styles.viewText}>[보기]</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => toggleAgreement('privacy')}
              disabled={isSubmitting}
            >
              <Image 
                source={agreements.privacy ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} 
                style={styles.checkbox} 
              />
              <Text style={styles.checkboxText}>[필수] 개인정보 처리방침</Text>
              <TouchableOpacity 
                onPress={() => showModal('개인정보 처리방침', privacyPolicyText)}
                disabled={isSubmitting}
              >
                <Text style={styles.viewText}>[보기]</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => toggleAgreement('marketing')}
              disabled={isSubmitting}
            >
              <Image 
                source={agreements.marketing ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} 
                style={styles.checkbox} 
              />
              <Text style={styles.checkboxText}>[선택] 마케팅 정보 수신 동의</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.signUpButton, isSubmitting && styles.signUpButtonDisabled]} 
          onPress={handleSignUp}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signUpButtonText}>가입 완료</Text>
          )}
        </TouchableOpacity>
      </View>

      <CommonPopup
        visible={showAgreementPopup}
        title="알림"
        message="필수 약관에 동의해주세요."
        confirmText="확인"
        onConfirm={() => setShowAgreementPopup(false)}
        type="warning"
      />

      <CommonPopup
        visible={showErrorPopup}
        title="알림"
        message={errorMessage}
        confirmText="확인"
        onConfirm={() => setShowErrorPopup(false)}
        type="warning"
      />

      <CommonModal
        visible={modalVisible}
        title={modalTitle}
        content={modalContent}
        onClose={() => setModalVisible(false)}
        showCloseButton={false}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    paddingHorizontal: scale(16),
  },
  profileSection: {
    alignItems: 'center',
    marginTop: scale(30),
  },
  title: {
    fontSize: scale(20),
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
    marginTop: scale(20),
  },
  inputContainer: {
    marginTop: scale(25),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
  },
  underline: {
    borderBottomWidth: 0.5,
    borderWidth: 1,
    borderColor: '#444444',
    marginTop: Platform.OS === 'ios' ? scale(10) : scale(0),
  },
  areementUnderline: {
    borderBottomWidth: 1,
    borderColor: '#D9D9D9',
    marginTop: scale(10),
  },
  characterCount: {
    color: '#848484',
    fontSize: scale(12),
    marginLeft: scale(10),
  },
  errorContainer: {
    height: scale(20),
    marginTop: scale(5),
  },
  errorText: {
    color: '#FF0000',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  agreementTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    marginTop: scale(10),
    fontFamily: 'Pretendard-Regular',
  },
  agreementDescription: {
    color: '#D9D9D9',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(15),
  },
  checkbox: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
    marginRight: scale(10),
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    flex: 1,
    fontFamily: 'Pretendard-Regular',
  },
  allCheckboxText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  viewText: {
    color: '#848484',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  agreementTextContainer: {
  },
  signUpButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(8),
    paddingVertical: scale(14),
    marginTop: 'auto',
    marginBottom: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonDisabled: {
    backgroundColor: '#2A7A30',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
});

export default SignUp; 