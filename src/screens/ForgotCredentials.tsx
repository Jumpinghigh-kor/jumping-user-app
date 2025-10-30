import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import CommonHeader from '../components/CommonHeader';
import CommonPopup from '../components/CommonPopup';
import { scale } from '../utils/responsive';
import { findId, findPassword } from '../api/services/membersService';
import Clipboard from '@react-native-clipboard/clipboard';
import CustomToast from '../components/CustomToast';
import IMAGES from '../utils/images';
import { commonStyle } from '../assets/styles/common';

const Tab = createMaterialTopTabNavigator();
const screenWidth = Dimensions.get('window').width;

// 아이디 찾기 탭
const FindIDScreen = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idInfo, setIdInfo] = useState<any>(null);
  const [popup, setPopup] = useState({
    visible: false,
    message: '',
    type: 'default' as 'default' | 'warning' | 'confirm',
  });
  const [customToastMessage, setCustomToastMessage] = useState('');
  const [showCustomToast, setShowCustomToast] = useState(false);
  const showPopup = (message: string, type: 'default' | 'warning' | 'confirm' = 'default') => {
    setPopup({
      visible: true,
      message,
      type,
    });
  };

  const handleFindID = async () => {
    try {

      if (!name || !phone) {
        showPopup('이름과 전화번호를 모두 입력해주세요.', 'warning');
        return;
      }

      const response = await findId(name, phone);
      if (response.success) {
        setIdInfo(response.data);
      } else {
        setIdInfo(null);
        showPopup('입력하신 정보로 아이디를 찾을 수 없습니다.', 'warning');
      }
      
    } catch (error) {
      showPopup('아이디 찾기 중 문제가 발생했습니다.', 'warning');
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
            maxLength={11}
          />
        </View>

        {idInfo && (
          <View style={styles.idContainer}>
            <View />
            <View style={{width: '50%'}}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Text style={[styles.idText]}>아이디 : {idInfo.mem_email_id}</Text>
                <TouchableOpacity onPress={() => {
                  Clipboard.setString(idInfo.mem_email_id);
                  setCustomToastMessage(idInfo.mem_email_id + '가 복사되었습니다');
                  setShowCustomToast(true);
                }}>
                  <Image source={IMAGES.icons.copyWhite} style={[styles.copyIcon, {marginLeft: scale(10)}]} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.idText, {marginTop: scale(10)}]}>가입일 : {idInfo.app_reg_dt}</Text>
            </View>
            <View />
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button]}
          onPress={() => handleFindID()}
          >
          <Text style={styles.buttonText}>확인</Text>
        </TouchableOpacity>
      </View>

      <CommonPopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onConfirm={() => setPopup({ ...popup, visible: false })}
      />

      {/* 커스텀 토스트 */}
      <CustomToast
        visible={showCustomToast}
        message={customToastMessage}
        onHide={() => setShowCustomToast(false)}
        position="bottom"
      />
    </View>
  );
};

// 비밀번호 찾기 탭
const FindPasswordScreen = () => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [customToastMessage, setCustomToastMessage] = useState('');
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<any>(null);
  const [popup, setPopup] = useState({
    visible: false,
    message: '',
    type: 'default' as 'default' | 'warning' | 'confirm',
  });

  const showPopup = (message: string, type: 'default' | 'warning' | 'confirm' = 'default') => {
    setPopup({
      visible: true,
      message,
      type,
    });
  };

  const handleFindID = async () => {
    try {

      if ( !id || !name || !phone) {
        showPopup('아이디, 이름, 전화번호를 모두 입력해주세요.', 'warning');
        return;
      }

      const response = await findPassword(id, name, phone);
      
      if (response.success) {
        setPasswordInfo(response.data);

      } else {
        setPasswordInfo(null);
        showPopup('입력하신 정보로 비밀번호를 찾을 수 없습니다.', 'warning');
      }

    } catch (error) {
      showPopup('비밀번호 찾기 중 문제가 발생했습니다.', 'warning');
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.inputField}>
          <TextInput
            style={styles.underlineInput}
            placeholder="아이디"
            placeholderTextColor="#848484"
            value={id}
            onChangeText={setId}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputField}>
          <TextInput
            style={styles.underlineInput}
            placeholder="이름"
            placeholderTextColor="#848484"
            value={name}
            onChangeText={setName}
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
          />
        </View>

        {passwordInfo && (
          <View>
            <View style={[styles.pwdContainer]}>
              <Text style={[styles.pwdText]}>임시 비밀번호 : {passwordInfo.temporary_password}</Text>
              <TouchableOpacity onPress={() => {
                Clipboard.setString(passwordInfo.temporary_password);
                setCustomToastMessage(passwordInfo.temporary_password + '가 복사되었습니다');
                setShowCustomToast(true);
              }}>
                <Image source={IMAGES.icons.copyWhite} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>

            <View style={[commonStyle.mt25]}>
              <Text style={[styles.guideText]}>
                - 임시 비밀번호 옆 
                <Text style={{color: '#F04D4D'}}> 문서 아이콘</Text>
                을 클릭하면 임시 비밀번호를
                <Text style={{color: '#F04D4D'}}> 복사</Text>
                할 수 있습니다. 로그인 할 때
                <Text style={{color: '#F04D4D'}}> 붙여넣기 </Text>
                해서 입력해주세요.
                </Text>
              <Text style={[styles.guideText]}>
                - 임시 비밀번호 발급 후 
                <Text style={{color: '#40B649'}}>[마이페이지 -&gt; 내 계정 정보 -&gt; 비밀번호 변경]</Text>
                에서 반드시 비밀번호를
                <Text style={{color: '#F04D4D'}}> 변경 </Text>해주세요.
              </Text>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button]}
          onPress={() => handleFindID()}
        >
          <Text style={styles.buttonText}>확인</Text>
        </TouchableOpacity>
      </View>

      <CommonPopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onConfirm={() => setPopup({ ...popup, visible: false })}
      />

      {/* 커스텀 토스트 */}
      <CustomToast
        visible={showCustomToast}
        message={customToastMessage}
        onHide={() => setShowCustomToast(false)}
        position="bottom"
      />
    </View>
  );
};

// 메인 화면
const ForgotCredentials = ({ route }) => {
  // Login 화면에서 넘어온 초기 탭 정보 확인
  const initialTab = route?.params?.initialTab || 'FindID';

  return (
    <>
      <CommonHeader title={''} />
      <Tab.Navigator
        id={undefined}
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
  idContainer: {
    width: '100%',
    marginTop: scale(20),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingVertical: scale(30),
    borderRadius: scale(10),
  },
  idText: {
    color: '#FFFFFF',
    fontSize: scale(14),
  },
  pwdContainer: {
    width: '100%',
    marginTop: scale(20),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingVertical: scale(30),
    borderRadius: scale(10),
  },
  pwdText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    marginRight: scale(10),
  },
  copyIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginTop: scale(10),
  },
});

export default ForgotCredentials;
