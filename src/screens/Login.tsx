import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import authService from '../api/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonPopup from '../components/CommonPopup';

type RootStackParamList = {
  Login: undefined;
  MainTab: undefined;
  ForgotCredentials: {initialTab?: string};
  SignUp: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLogin, setAutoLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const [signupPopup, setSignupPopup] = useState(false);
  const [errorPopup, setErrorPopup] = useState(false);

  useEffect(() => {
    // 자동 로그인 체크
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    try {
      const isAutoLogin = await AsyncStorage.getItem('autoLogin');
      if (isAutoLogin === 'true') {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setAutoLogin(true); // 자동로그인 상태 복원
          handleLogin(savedEmail, savedPassword);
        }
      }
    } catch (error) {
      console.log('자동 로그인 체크 실패:', error);
    }
  };

  const handleLogin = async (emailParam?: string, passwordParam?: string) => {
    const emailToUse = emailParam || email;
    const passwordToUse = passwordParam || password;
    const isAutoLoginAttempt = !!(emailParam && passwordParam); // 자동로그인 시도인지 확인
    
    if (!emailToUse || !passwordToUse) {
      setError('이메일과 비밀번호를 입력해주세요.');
      setErrorPopup(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authService.login({
        mem_email_id: emailToUse,
        mem_app_password: passwordToUse,
      });
      
      if (response.success) {
        // 자동 로그인 설정 저장
        if (isAutoLoginAttempt || autoLogin) {
          // 자동로그인 시도이거나 수동 로그인에서 자동로그인을 체크한 경우
          await AsyncStorage.setItem('autoLogin', 'true');
          await AsyncStorage.setItem('savedEmail', emailToUse);
          await AsyncStorage.setItem('savedPassword', passwordToUse);
        } else if (!isAutoLoginAttempt && !autoLogin) {
          // 수동 로그인에서 자동로그인을 체크하지 않은 경우만 삭제
          await AsyncStorage.removeItem('autoLogin');
          await AsyncStorage.removeItem('savedEmail');
          await AsyncStorage.removeItem('savedPassword');
        }
        // isAutoLoginAttempt이고 autoLogin이 false인 경우는 아무것도 하지 않음 (기존 정보 유지)
        
        // 토큰 저장
        await AsyncStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
        }
        
        // 사용자 정보 저장
        await AsyncStorage.multiSet([
          ['mem_id', response.data.user.mem_id.toString()],
          ['center_id', response.data.user.center_id.toString()],
          ['mem_name', response.data.user.mem_name],
          ['mem_email_id', response.data.user.mem_email_id],
        ]);
        
        // 사용자 상태에 따라 다른 화면으로 이동
        if (response.data.user.mem_app_status === 'ACTIVE') {
          navigation.reset({
            index: 0,
            routes: [{name: 'MainTab' as keyof RootStackParamList}],
          });
        } else if (response.data.user.mem_app_status === 'PROCEED') {
          navigation.reset({
            index: 0,
            routes: [{name: 'SignUp' as keyof RootStackParamList}],
          });
        } else {
          // 기타 상태일 경우 기본적으로 MainTab으로 이동
          navigation.reset({
            index: 0,
            routes: [{name: 'MainTab' as keyof RootStackParamList}],
          });
        }
      } else {
        const message = response?.data?.message || '로그인에 실패했습니다.';
        setError(message);
        setErrorPopup(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      setErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotId = () => {
    navigation.navigate('ForgotCredentials', { initialTab: 'FindID' });
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotCredentials', { initialTab: 'FindPassword' });
  };

  const handleSignupClick = () => {
    setSignupPopup(true);
  };

  const handleCloseSignupPopup = () => {
    setSignupPopup(false);
  };

  const handleCloseErrorPopup = () => {
    setErrorPopup(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Welcome Text */}
        <Image source={IMAGES.logo.jumpingWhite} style={styles.logoImage} />

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            placeholderTextColor="#FFFFFF"
            maxLength={100}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              placeholderTextColor="#FFFFFF"
              maxLength={100}
            />
            <TouchableOpacity 
              style={styles.visibilityIcon} 
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Image 
                source={showPassword ? IMAGES.icons.visibleWhite : IMAGES.icons.invisibleWhite} 
                style={styles.eyeIconImage}
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.autoLoginContainer}
            onPress={() => setAutoLogin(!autoLogin)}
            disabled={loading}
          >
            <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
              {autoLogin && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.autoLoginText}>자동로그인 설정</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={() => handleLogin()}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator style={{width: scale(15), height: scale(15)}} color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>로그인</Text>
          )}
        </TouchableOpacity>

        {/* 회원가입 Button */}
        <TouchableOpacity
          style={[styles.signUpButton]}
          onPress={handleSignupClick}
        >
          <Text style={styles.signUpButtonText}>회원가입</Text>
        </TouchableOpacity>

        <View style={styles.forgotContainer}>
          <View style={styles.forgotTextContainer}>
            <TouchableOpacity onPress={handleForgotId} disabled={loading}>
              <Text style={styles.forgotText}>아이디 찾기</Text>
            </TouchableOpacity>
            <Text style={[styles.forgotText, {marginHorizontal: scale(15)}]}>|</Text>
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotText}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 회원가입 안내 팝업 */}
        <CommonPopup
          visible={signupPopup}
          message={'회원가입은 매장에서 도와드리고 있어요:)\n현재 다니고 있는 매장에 문의해주세요!'}
          onConfirm={handleCloseSignupPopup}
          confirmText="확인"
        />

        {/* 오류 안내 팝업 */}
        <CommonPopup
          visible={errorPopup}
          message={error || ''}
          type="warning"
          onConfirm={handleCloseErrorPopup}
          confirmText="확인"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  innerContainer: {
    marginTop: scale(30),
    padding: scale(16),
  },
  logoImage: {
    width: scale(150),
    height: scale(150),
    alignSelf:'center',
    resizeMode: 'contain',
    marginBottom: scale(30),
  },
  inputContainer: {
    // marginBottom: 20,
  },
  input: {
    backgroundColor: '#373737',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: scale(15),
    padding: scale(15),
    marginBottom: scale(15),
    fontSize: scale(14),
    color: '#FFFFFF',
    height: scale(50),
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#373737',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: scale(15),
    marginBottom: scale(15),
    alignItems: 'center',
    height: scale(50),
  },
  passwordInput: {
    flex: 1,
    padding: scale(15),
    fontSize: scale(14),
    color: '#FFFFFF',
    height: scale(50),
  },
  visibilityIcon: {
    padding: scale(10),
    marginRight: scale(5),
  },
  eyeIconImage: {
    width: scale(15),
    height: scale(15),
    resizeMode: 'contain',
  },
  loginButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(13),  
    height: scale(45),
    alignItems: 'center',
    marginTop: scale(15),
    marginBottom: scale(10),
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#40B64980',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: scale(14),
    fontWeight: '600',
  },
  forgotContainer: {
    alignItems: 'center',
  },
  forgotTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotText: {
    color: '#848484',
    fontSize: scale(12),
    textAlign: 'center',
  },
  autoLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  checkbox: {
    width: scale(16),
    height: scale(16),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: scale(4),
    backgroundColor: '#FAFAFA',
    marginRight: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#40B649',
    borderColor: '#40B649',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  autoLoginText: {
    color: '#848484',
    fontSize: scale(12),
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(13),  
    height: scale(45),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(20),
  },
  signUpButtonText: {
    color: '#000000',
    fontSize: scale(14),
    fontWeight: '600',
  },
});

export default Login;
