import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonPopup from '../components/CommonPopup';

const Settings = () => {
  const navigation = useNavigation();
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [currentAction, setCurrentAction] = useState<string>('');

  const handleGoBack = () => {
    navigation.goBack();
  };

  const showPopup = (title: string, message: string, action: string) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setCurrentAction(action);
    setPopupVisible(true);
  };

  const handlePopupConfirm = async () => {
    setPopupVisible(false);
    
    if (currentAction === 'logout') {
      try {
        // 모든 저장된 데이터 삭제
        await AsyncStorage.multiRemove([
          'accessToken',
          'refreshToken',
          'memberId',
          // 필요한 경우 다른 데이터도 여기에 추가
        ]);
        
        // 로그인 화면으로 이동
        navigation.reset({
          index: 0,
          routes: [{name: 'Login' as never}],
        });
      } catch (error) {
        Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
      }
    } else if (currentAction === 'withdrawal') {
      // 회원 탈퇴 로직 구현 (아직 구현되지 않음)
      showPopup('알림', '회원 탈퇴 기능은 아직 개발 중입니다.', 'none');
    }
  };

  const handlePopupCancel = () => {
    setPopupVisible(false);
  };

  const handleLogout = () => {
    showPopup('로그아웃', '정말 로그아웃 하시겠습니까?', 'logout');
  };

  const handlePasswordChange = () => {
    // 비밀번호 변경 화면으로 이동
    navigation.navigate('PasswordChange' as never);
  };

  const handleWithdrawal = () => {
    showPopup('회원 탈퇴', '정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.', 'withdrawal');
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
        <Text style={styles.headerTitle}>환경설정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handlePasswordChange}
          >
            <Text style={styles.menuText}>비밀번호 변경</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <Text style={styles.menuText}>로그아웃</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleWithdrawal}
          >
            <Text style={styles.withdrawalText}>회원탈퇴</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CommonPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMessage}
        onConfirm={handlePopupConfirm}
        onCancel={currentAction === 'none' ? undefined : handlePopupCancel}
        confirmText="확인"
        cancelText="취소"
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