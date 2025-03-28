import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, Image, Platform, ScrollView} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import IMAGES from '../utils/images';
import {useAuth} from '../hooks/useAuth';
import {scale} from '../utils/responsive';
import {privacyPolicyText, termsOfServiceText} from '../utils/termsData';
import {getInquiryList} from '../api/services/inquiryService';
import {getNoticesAppList} from '../api/services/noticesAppService';
import {getUpdateLogAppInfo, UpdateLogInfo} from '../api/services/updateLogAppService';
import { formatDateYYYYMMDD } from '../utils/commonFunctions';
import ProfileImagePicker from '../components/ProfileImagePicker';
import { getMemberImageFile } from '../api/services/profileService';
import { supabase } from '../utils/supabaseClient';
import { useProfileImage } from '../hooks/useProfileImage';
import CommonModal from '../components/CommonModal';

// Package.json 버전 정보 가져오기
const appVersion = require('../../package.json').version;

const MyPage = () => {
  const navigation = useNavigation();
  const {memberInfo, loadMemberInfo} = useAuth();
  const { profileImageUrl, loadProfileImage } = useProfileImage(memberInfo?.mem_id);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [hasUnreadNotices, setHasUnreadNotices] = useState(false);
  const [hasUnreadInquiries, setHasUnreadInquiries] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateLogInfo | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadMemberInfo();
      checkUnreadNotices();
      checkUnreadInquiries();
      fetchUpdateInfo();
      loadProfileImage();
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

  const checkUnreadNotices = async () => {
    try {
      const readNoticesStr = await AsyncStorage.getItem('readNotices');
      const readNotices = readNoticesStr ? JSON.parse(readNoticesStr) : [];
      
      const response = await getNoticesAppList();
      if (response.success && response.data) {
        const unreadExists = response.data.some(notice => 
          !readNotices.includes(notice.notices_app_id)
        );
        setHasUnreadNotices(unreadExists);
      }
    } catch (error) {
      
    }
  };

  const checkUnreadInquiries = async () => {
    try {
      const readInquiriesStr = await AsyncStorage.getItem('readInquiries');
      const readInquiries = readInquiriesStr ? JSON.parse(readInquiriesStr) : [];
      
      const response = await getInquiryList();
      if (response.success && response.data) {
        const unreadExists = response.data.some(inquiry => 
          inquiry.answer && !readInquiries.includes(inquiry.inquiry_app_id)
        );
        setHasUnreadInquiries(unreadExists);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileIconContainer}>
          <ProfileImagePicker
            memId={memberInfo?.mem_id}
            currentImageUrl={profileImageUrl}
            onImageUpdate={loadProfileImage}
          />
          <Text style={styles.nickname}>{memberInfo?.mem_nickname}</Text>
          <Text style={styles.emailId}>{memberInfo?.mem_email_id}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>키</Text>
          <Text style={styles.statsDivider}>|</Text>
          <Text style={styles.statsText}>포인트</Text>
          <Text style={styles.statsDivider}>|</Text>
          <Text style={styles.statsText}>몸무게</Text>
        </View>

        <Text style={styles.sectionTitle}>고객센터</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('NoticesAppList' as never)}
          >
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>공지사항</Text>
              {hasUnreadNotices && (
                <View style={styles.notificationDot} />
              )}
            </View>
            <Image 
              source={IMAGES.icons.arrowRightWhite} 
              style={styles.menuArrow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('InquiryAppList' as never)}
          >
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>문의</Text>
              {hasUnreadInquiries && (
                <View style={styles.notificationDot} />
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
            <Text style={styles.menuText}>환경설정</Text>
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
        </View>
        <View style={styles.bottomPadding}></View>
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
        showCloseButton={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    padding: scale(16),
  },
  profileIconContainer: {
    alignItems: 'center',
    marginTop: scale(20),
    marginBottom: scale(20),
  },
  nickname: {
    fontSize: scale(12),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: scale(10),
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#43B546',
    borderRadius: scale(8),
    padding: scale(12),
    marginTop: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsText: {
    color: '#ffffff',
    fontSize: scale(12),
    fontWeight: 'bold',
    paddingHorizontal: scale(10),
  },
  statsDivider: {
    color: '#ffffff',
    fontSize: scale(12),
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginTop: scale(25),
    marginBottom: scale(10),
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
  menuText: {
    color: '#ffffff',
    fontSize: scale(12),
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
  },
  bottomPadding: {
    height: scale(80),
  },
  menuTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#FF0000',
    marginLeft: scale(5),
  },
});

export default MyPage; 