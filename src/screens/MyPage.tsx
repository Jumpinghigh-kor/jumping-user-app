import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, Image, Platform, ScrollView, Switch} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import IMAGES from '../utils/images';
import {useAuth} from '../hooks/useAuth';
import {scale} from '../utils/responsive';
import {privacyPolicyText, termsOfServiceText} from '../constants/termsData';
import {getUpdateLogAppInfo, UpdateLogInfo} from '../api/services/updateLogAppService';
import { formatDateYYYYMMDD } from '../utils/commonFunction';
import ProfileImagePicker from '../components/ProfileImagePicker';
import { getMemberImageFile } from '../api/services/profileService';
import { supabase } from '../utils/supabaseClient';
import { useProfileImage } from '../hooks/useProfileImage';
import CommonModal from '../components/CommonModal';
import {getNoticesAppList} from '../api/services/noticesAppService';
import {getInquiryList} from '../api/services/inquiryService';
import { getPostAppList } from '../api/services/postAppService';
import {updatePushYn} from '../api/services/membersService';
import { commonStyle, layoutStyle } from '../assets/styles/common';

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
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);
  const [hasUnreadInquiry, setHasUnreadInquiry] = useState(false);
  const [hasUnreadPost, setHasUnreadPost] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const [isCompanyInfoVisible, setIsCompanyInfoVisible] = useState(false);

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
      let noticeUnread = false;
      if (noticesResponse.success && noticesResponse.data) {
        noticeUnread = noticesResponse.data.some(notice => 
          !readNotices.includes(notice.notices_app_id)
        );
      }
      
      // 문의 목록 가져오기
      const inquiriesResponse = await getInquiryList({mem_id: parseInt(memberInfo.mem_id, 10)});
      let inquiryUnread = false;
      if (inquiriesResponse.success && inquiriesResponse.data) {
        inquiryUnread = inquiriesResponse.data.some(inquiry => 
          inquiry.answer && !readInquiries.includes(inquiry.inquiry_app_id)
        );
      }
      
      // 우편함 목록 가져오기 및 미읽음 체크
      let postUnread = false;
      try {
        const postsResponse = await getPostAppList(parseInt(memberInfo.mem_id, 10), 'JUMPING');
        if (postsResponse.success && postsResponse.data) {
          postUnread = postsResponse.data.some((item: any) => {
            const allSendYn = item.all_send_yn;
            const readYn = item.read_yn;
            return (
              (allSendYn === 'N' && readYn === 'N') ||
              (allSendYn === 'Y' && (!readYn || readYn === ''))
            );
          });
        }
      } catch (e) {}

      // 하나라도 읽지 않은 알림이 있으면 true로 설정
      setHasUnreadNotice(noticeUnread);
      setHasUnreadInquiry(inquiryUnread);
      setHasUnreadPost(postUnread);
      setHasUnreadNotifications(noticeUnread || inquiryUnread || postUnread);
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
        } else {
          console.error('푸시 설정 업데이트 실패:', response.message);
          // 실패 시 UI 되돌림
          setIsPushEnabled(prev => !enabled);
        }
      }
    } catch (error) {
      console.error('푸시 설정 저장 실패:', error);
      // 오류 시 UI 되돌림
      setIsPushEnabled(prev => !enabled);
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
          <View style={{marginTop: scale(20), marginBottom: scale(10)}}>
            <Text style={styles.nickname}>{memberInfo?.mem_nickname}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>고객센터</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('NoticesAppList' as never)}
          >
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>공지사항</Text>
              {hasUnreadNotice && (
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
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>문의</Text>
              {hasUnreadInquiry && (
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
            onPress={() => navigation.navigate('PostList' as never)}
          >
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>우편함</Text>
              {hasUnreadPost && (
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

          <View style={styles.menuItem}>
            <Text style={styles.menuText}>푸시 알림 받기</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#43B546' }}
              thumbColor={isPushEnabled ? '#FFFFFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(next) => {
                if (isUpdatingPush) return;
                setIsUpdatingPush(true);
                // Optimistic UI 업데이트로 안드로이드 토글 깜빡임 방지
                setIsPushEnabled(next);
                Promise.resolve(savePushSetting(next)).finally(() => setIsUpdatingPush(false));
              }}
              value={isPushEnabled}
              style={styles.switchButton}
              disabled={isUpdatingPush}
            />
          </View>

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
        </View>
        <TouchableOpacity
          style={[layoutStyle.rowBetween, commonStyle.mt10]}
          onPress={() => setIsCompanyInfoVisible(!isCompanyInfoVisible)}
        >
          <Text style={styles.companyInfo}>(주)점핑하이 사업자 정보</Text>
          <Image source={isCompanyInfoVisible ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} style={styles.companyInfoArrow} />
        </TouchableOpacity>
        {isCompanyInfoVisible && (
          <View style={[commonStyle.mt5]}>
            <Text style={styles.companyInfo}>대표 : 윤하이</Text>
            <Text style={styles.companyInfo}>주소 : (07798)서울특별시 강서구 마곡서로 133 704동 2층</Text>
            <Text style={styles.companyInfo}>사업자등록번호 : 894-81-00990</Text>
            <Text style={styles.companyInfo}>아이디 : high@jumping.or.kr</Text>
            <Text style={styles.companyInfo}>통신판매업신고 : 제 2019-서울영등포-0932호</Text>
            <Text style={styles.companyInfo}>고객센터 : 02-1661-0042</Text>
            <Text style={styles.companyInfo}>개인정보보호책임자 : 신주섭</Text>
          </View>
        )}
      </ScrollView>

      <CommonModal
        visible={modalVisible}
        title={modalTitle}
        content={
          modalTitle === '현재 버전' && updateInfo
            ? `\n${modalContent}\n\n\n${updateInfo.reg_dt}`
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
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
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
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
  },
  notificationDot: {
    width: scale(12),
    height: scale(12),
    marginLeft: scale(4),
  },
  versionText: {
    color: '#999999',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
  },
  updateVersionText: {
    color: '#43B546',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
  },
  menuArrow: {
    width: scale(16),
    height: scale(16),
    tintColor: '#999999',
    resizeMode: 'contain',
  },
  switchButton: {
    transform: Platform.OS === 'ios' ? [{scaleX: 0.8}, {scaleY: 0.8}] : [{scaleX: 1}, {scaleY: 1}],
  },
  settingsModalContent: {
    padding: scale(10),
  },
  settingsMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(10),
  },
  companyInfo: {
    color: '#848484',
    fontSize: scale(10),
    marginBottom: scale(2),
    fontFamily: 'Pretendard-Medium',
  },
  companyInfoArrow: {
    width: scale(14),
    height: scale(14),
    resizeMode: 'contain',
    tintColor: '#848484',
  },
});

export default MyPage; 