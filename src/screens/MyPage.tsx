import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, Image, Platform, ScrollView, Switch} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import IMAGES from '../utils/images';
import {useAuth} from '../hooks/useAuth';
import {scale} from '../utils/responsive';
import {privacyPolicyText, termsOfServiceText} from '../utils/termsData';
import {getUpdateLogAppInfo, UpdateLogInfo} from '../api/services/updateLogAppService';
import { formatDateYYYYMMDD } from '../utils/commonFunction';
import ProfileImagePicker from '../components/ProfileImagePicker';
import { getMemberImageFile } from '../api/services/profileService';
import { supabase } from '../utils/supabaseClient';
import { useProfileImage } from '../hooks/useProfileImage';
import CommonModal from '../components/CommonModal';
import {getNoticesAppList} from '../api/services/noticesAppService';
import {getInquiryList} from '../api/services/inquiryService';
import {updatePushYn} from '../api/services/membersService';

// Package.json 버전 정보 가져오기
const appVersion = require('../../package.json').version;

const MyPage = () => {
  const navigation = useNavigation();
  const {memberInfo, loadMemberInfo} = useAuth();
  const { profileImageUrl, loadProfileImage } = useProfileImage(memberInfo?.mem_id);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [updateInfo, setUpdateInfo] = useState<UpdateLogInfo | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // 읽지 않은 알림이 있는지 체크
  const checkUnreadNotifications = async () => {
    try {
      // 읽은 공지사항 가져오기
      const readNoticesStr = await AsyncStorage.getItem('readNotices');
      const readNotices = readNoticesStr ? JSON.parse(readNoticesStr) : [];
      
      // 읽은 문의 가져오기
      const readInquiriesStr = await AsyncStorage.getItem('readInquiries');
      const readInquiries = readInquiriesStr ? JSON.parse(readInquiriesStr) : [];
      
      // 공지사항 목록 가져오기
      const noticesResponse = await getNoticesAppList();
      let hasUnreadNotice = false;
      if (noticesResponse.success && noticesResponse.data) {
        hasUnreadNotice = noticesResponse.data.some(notice => 
          !readNotices.includes(notice.notices_app_id)
        );
      }
      
      // 문의 목록 가져오기
      const inquiriesResponse = await getInquiryList();
      let hasUnreadInquiry = false;
      if (inquiriesResponse.success && inquiriesResponse.data) {
        hasUnreadInquiry = inquiriesResponse.data.some(inquiry => 
          inquiry.answer && !readInquiries.includes(inquiry.inquiry_app_id)
        );
      }
      
      // 하나라도 읽지 않은 알림이 있으면 true로 설정
      setHasUnreadNotifications(hasUnreadNotice || hasUnreadInquiry);
    } catch (error) {
      console.error('알림 체크 실패:', error);
    }
  };

  // 푸시 알림 설정 불러오기
  const loadPushSetting = async () => {
    try {
      const pushSetting = await AsyncStorage.getItem('@push_enabled');
      setIsPushEnabled(pushSetting === 'true');
    } catch (error) {
      console.error('푸시 설정 불러오기 실패:', error);
    }
  };

  // 푸시 알림 설정 저장하기
  const savePushSetting = async (enabled: boolean) => {
    try {
      // API 호출
      if (memberInfo?.mem_id) {
        const response = await updatePushYn({
          mem_id: memberInfo.mem_id,
          push_yn: enabled ? 'Y' : 'N'
        });
        
        if (response.success) {
          await AsyncStorage.setItem('@push_enabled', enabled.toString());
          setIsPushEnabled(enabled);
        } else {
          console.error('푸시 설정 업데이트 실패:', response.message);
        }
      }
    } catch (error) {
      console.error('푸시 설정 저장 실패:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMemberInfo();
      fetchUpdateInfo();
      loadProfileImage();
      checkUnreadNotifications();
      loadPushSetting();
    }, [memberInfo?.mem_id]),
  );

  const fetchUpdateInfo = async () => {
    try {
      const response = await getUpdateLogAppInfo();
      
      if (response.success && response.data) {
        setUpdateInfo(response.data);
      }
    } catch (error) {
      
    }
  };

  const showModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: scale(90)}}>
        <View style={styles.profileIconContainer}>
          <ProfileImagePicker
            memId={memberInfo?.mem_id}
            currentImageUrl={profileImageUrl}
            onImageUpdate={loadProfileImage}
          />
          <View style={{marginVertical: scale(10)}}>
            <Text style={styles.nickname}>{memberInfo?.mem_nickname}</Text>
            <Text style={styles.centerName}>{memberInfo?.center_name}</Text>
          </View>
          <Text style={styles.emailId}>회원번호 : {memberInfo?.mem_checkin_number}</Text>
          <Text style={styles.emailId}>{memberInfo?.mem_email_id}</Text>
        </View>

        <Text style={styles.sectionTitle}>고객센터</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('NoticesAppList' as never)}
          >
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>공지사항</Text>
              {hasUnreadNotifications && (
                <Image 
                  source={IMAGES.icons.exclamationMarkRed}
                  style={styles.notificationDot}
                />
              )}
            </View>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('InquiryList' as never)}
          >
            <Text style={styles.menuText}>문의</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>약관 및 정책</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showModal('개인정보 처리방침', privacyPolicyText)}
          >
            <Text style={styles.menuText}>개인정보 처리방침</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => showModal('이용약관', termsOfServiceText)}
          >
            <Text style={styles.menuText}>이용약관</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Text style={styles.menuText}>내 계정 정보</Text>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              const content = updateInfo 
                ? `${updateInfo.up_app_desc}`
                : `최신 버전입니다.`;
              showModal('현재 버전', content);
            }}
          >
            <Text style={styles.menuText}>현재 버전</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {updateInfo && (
                <Text style={styles.updateVersionText}>{updateInfo.up_app_version}</Text>
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>푸시 알람 받기</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#43B546' }}
              thumbColor={isPushEnabled ? '#FFFFFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={savePushSetting}
              value={isPushEnabled}
              style={styles.switchButton}
            />
          </View>
        </View>
      </ScrollView>

      <CommonModal
        visible={modalVisible}
        title={modalTitle}
        content={
          modalTitle === '현재 버전' && updateInfo
            ? `${modalContent}\n\n${formatDateYYYYMMDD(updateInfo.reg_dt)}`
            : modalContent
        }
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    padding: scale(16),
    paddingTop: scale(40),
  },
  profileIconContainer: {
    alignItems: 'center',
    marginTop: scale(20),
    marginBottom: scale(30),
  },
  nickname: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  centerName: {
    fontSize: scale(12),
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emailId: {
    color: '#aaaaaa',
    fontSize: scale(12),
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIcon: {
    width: scale(24),
    height: scale(24),
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginTop: scale(25),
    marginBottom: scale(15),
  },
  menuContainer: {
    borderRadius: scale(8),
    backgroundColor: '#373737',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(15),
    paddingHorizontal: scale(16),
  },
  menuTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    color: '#ffffff',
    fontSize: scale(12),
  },
  notificationDot: {
    width: scale(12),
    height: scale(12),
    marginLeft: scale(4),
  },
  versionText: {
    color: '#999999',
    fontSize: scale(12),
  },
  updateVersionText: {
    color: '#43B546',
    fontSize: scale(12),
  },
  menuArrow: {
    width: scale(16),
    height: scale(16),
    tintColor: '#999999',
    resizeMode: 'contain',
  },
  switchButton: {
    transform: [{scaleX: 0.8}, {scaleY: 0.8}],
  },
});

export default MyPage; 