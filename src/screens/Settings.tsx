import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonPopup from '../components/CommonPopup';
import CommonHeader from '../components/CommonHeader';
import {useAuth} from '../hooks/useAuth';
import {updateMemberWithdrawal} from '../api/services/membersService';
import CustomToast from '../components/CustomToast';

const Settings = () => {
  const navigation = useNavigation();
  const {logout, memberInfo} = useAuth();
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');


  const showPopup = (title: string, message: string, action: string) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setCurrentAction(action);
    setPopupVisible(true);
  };

  // 모든 데이터 삭제 함수
  const clearAllData = async () => {
    await logout();
    
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'access_token',
      'refresh_token',
      'center_id',
      'mem_name',
      'mem_email_id',
      'autoLogin',
      'savedEmail',
      'savedPassword',
      '@push_enabled',
      'readNotices',
      'readInquiries',
    ]);
    
    navigation.reset({
      index: 0,
      routes: [{name: 'Login' as never}],
    });
  };

  const handlePopupConfirm = async () => {
    setPopupVisible(false);
    
    if (currentAction === 'logout') {
      try {
        await clearAllData();
      } catch (error) {
        setToastMessage('로그아웃 중 문제가 발생했습니다.');
        setShowToast(true);
      }
    } else if (currentAction === 'withdrawal') {
      try {
        if (memberInfo?.mem_id) {
          // 회원 탈퇴 API 호출
          await updateMemberWithdrawal(memberInfo.mem_id.toString());
          
          // 로그아웃 처리
          await clearAllData();
        }
      } catch (error) {
        setToastMessage('회원 탈퇴 중 문제가 발생했습니다.');
        setShowToast(true);
      }
    }
  };

  return ( 
    <View style={styles.container}>
      <CommonHeader title="환경설정" />
      <View style={styles.contentContainer}>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('NicknameChange' as never)}
          >
            <Text style={styles.menuText}>닉네임 변경</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('PasswordChange' as never)}
          >
            <Text style={styles.menuText}>비밀번호 변경</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showPopup('로그아웃', '정말 로그아웃 하시겠습니까?', 'logout')}
          >
            <Text style={styles.menuText}>로그아웃</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showPopup('회원탈퇴', '정말 회원탈퇴 하시겠습니까?', 'withdrawal')}
          >
            <Text style={styles.withdrawalText}>회원탈퇴</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <CommonPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMessage}
        type={currentAction === 'withdrawal' ? 'warning' : 'default'}
        onConfirm={handlePopupConfirm}
        onCancel={currentAction === 'none' ? undefined : () => setPopupVisible(false)}
        confirmText="확인"
        cancelText="취소"
      />

      <CustomToast
        visible={showToast}
        message={toastMessage}
        position="bottom"
        onHide={() => setShowToast(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  contentContainer: {
    flex: 1,
    padding: scale(16),
  },
  menuContainer: {
    borderRadius: scale(8),
    backgroundColor: '#373737',
    overflow: 'hidden',
    marginTop: scale(10),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(15),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  withdrawalText: {
    color: '#FF4444',
    fontSize: scale(12),
  },
  menuArrow: {
    width: scale(16),
    height: scale(16),
    tintColor: '#999999',
  },
});

export default Settings; 