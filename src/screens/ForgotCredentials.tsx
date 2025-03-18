import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();
const screenWidth = Dimensions.get('window').width;

// 아이디 찾기 탭
const FindIDScreen = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFindID = async () => {
    if (!name || !phone) {
      Alert.alert('알림', '이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      // TODO: API 호출 구현
      Alert.alert('알림', '입력하신 정보로 아이디를 찾을 수 없습니다.');
    } catch (error) {
      Alert.alert('오류', '아이디 찾기 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        회원가입 시 입력한 이름과 전화번호를 입력해주세요.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="이름"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="전화번호"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleFindID}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>아이디 찾기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// 비밀번호 찾기 탭
const FindPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFindPassword = async () => {
    if (!email) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      // TODO: API 호출 구현
      Alert.alert(
        '알림',
        '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.',
      );
    } catch (error) {
      Alert.alert('오류', '비밀번호 찾기 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        가입한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleFindPassword}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>비밀번호 재설정</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// 메인 화면
const ForgotCredentials = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666666',
        tabBarIndicatorStyle: {
          backgroundColor: '#007AFF',
          height: 3,
          width: screenWidth / 2,
        },
        tabBarStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarItemStyle: {
          width: screenWidth / 2,
        },
      }}>
      <Tab.Screen
        name="FindID"
        component={FindIDScreen}
        options={{tabBarLabel: '아이디 찾기'}}
      />
      <Tab.Screen
        name="FindPassword"
        component={FindPasswordScreen}
        options={{tabBarLabel: '비밀번호 찾기'}}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    height: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#007AFF80',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ForgotCredentials;
