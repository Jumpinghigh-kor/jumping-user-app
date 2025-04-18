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
import CommonHeader from '../components/CommonHeader';
import { scale } from '../utils/responsive';

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
      <View style={styles.contentContainer}>
        <View style={styles.inputField}>
          <TextInput
            style={styles.underlineInput}
            placeholder="이름"
            placeholderTextColor="#848484"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>
        
        <View style={styles.inputField}>
          <TextInput
            style={styles.underlineInput}
            placeholder="휴대폰 번호 (-제외)"
            placeholderTextColor="#848484"
            value={phone}
            onChangeText={(text) => {
              const onlyNumber = text.replace(/[^0-9]/g, '');
              setPhone(onlyNumber);
            }}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleFindID}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>아이디 찾기</Text>
          )}
        </TouchableOpacity>
      </View>
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
      <View style={styles.contentContainer}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleFindPassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>비밀번호 재설정</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 메인 화면
const ForgotCredentials = ({ route }) => {
  // Login 화면에서 넘어온 초기 탭 정보 확인
  const initialTab = route?.params?.initialTab || 'FindID';

  return (
    <>
      <CommonHeader />
      <Tab.Navigator
        initialRouteName={initialTab}
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#FFFFFF',
          tabBarIndicatorStyle: {
            backgroundColor: '#40B649',
            height: 3,
            width: screenWidth / 2,
          },
          tabBarStyle: {
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: '#202020',
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    paddingHorizontal: scale(16),
    paddingTop: scale(50),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: scale(20),
  },
  input: {
    backgroundColor: '#373737',
    borderRadius: scale(10),
    padding: scale(15),
    marginBottom: scale(15),
    fontSize: scale(16),
  },
  button: {
    backgroundColor: '#40B649',
    borderRadius: scale(10),
    paddingVertical: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#40B64980',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: scale(14),
    fontWeight: '600',
  },
  inputField: {
    marginBottom: scale(20),
  },
  underlineInput: {
    color: '#FFFFFF',
    fontSize: scale(14),
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    height: scale(40),
  },
});

export default ForgotCredentials;
