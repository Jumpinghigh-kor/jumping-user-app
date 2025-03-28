import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import authService from '../api/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  MainTab: undefined;
  ForgotCredentials: undefined;
  SignUp: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authService.login({
        mem_email_id: email,
        mem_app_password: password,
      });
      
      if (response.success) {
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
        const message = response.data?.message || '로그인에 실패했습니다.';
        setError(message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    navigation.navigate('ForgotCredentials');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Welcome Text */}
        <Text style={styles.welcomeText}>환영합니다</Text>
        <Text style={styles.subText}>계정 정보를 입력해주세요</Text>

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
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>로그인</Text>
          )}
        </TouchableOpacity>

        <View style={styles.forgotContainer}>
          <TouchableOpacity onPress={handleForgot} disabled={loading}>
            <Text style={styles.forgotText}>아이디/비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#007AFF80',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotContainer: {
    alignItems: 'center',
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default Login;
