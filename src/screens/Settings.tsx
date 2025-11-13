import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonPopup from '../components/CommonPopup';
import CommonHeader from '../components/CommonHeader';
import {useAuth} from '../hooks/useAuth';
import {updateMemberWithdrawal} from '../api/services/membersService';
import CustomToast from '../components/CustomToast';
import { getMemberOrdersList } from '../api/services/memberOrdersService';
import { formatDateYYYYMMDD } from '../utils/commonFunction';
import { commonStyle, layoutStyle } from '../assets/styles/common';

const Settings = () => {
  const navigation = useNavigation();
  const {logout, memberInfo, loadMemberInfo} = useAuth();
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [memberOrders, setMemberOrders] = useState<any[]>([]);


  const showPopup = (title: string, message: string, action: string) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setCurrentAction(action);
    setPopupVisible(true);
  };

  useEffect(() => {
    const fetchMemberOrders = async () => {
      try {
        if (!memberInfo?.mem_id) return;
        const res = await getMemberOrdersList({ mem_id: parseInt(memberInfo.mem_id as any, 10) });
        if (res?.success && Array.isArray(res?.data)) {
          setMemberOrders(res.data);
        } else {
          setMemberOrders([]);
        }
      } catch {
        setMemberOrders([]);
      }
    };
    fetchMemberOrders();
  }, [memberInfo?.mem_id]);

  // 화면 복귀 시 최신 회원 정보 반영 (닉네임 변경 후 뒤로가기 등)
  useFocusEffect(
    React.useCallback(() => {
      loadMemberInfo();
      return undefined;
    }, [])
  );

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
      'mem_app_id',
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
  
  const formatPhone344 = (raw: any) => {
    try {
      const digits = String(raw ?? '').replace(/\D/g, '');
      if (digits.length >= 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
      }
      return String(raw ?? '');
    } catch {
      return String(raw ?? '');
    }
  };

  return ( 
    <View style={styles.container}>
      <CommonHeader title="내 계정 정보" />
      <View style={styles.contentContainer}>
        <View>
          <View style={[layoutStyle.row, layoutStyle.alignCenter]}>
            <Text style={styles.infoLabel}>이름</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoText}>{memberInfo?.mem_name}</Text>
            </View>
          </View>
          <View style={[layoutStyle.row, commonStyle.mt10, layoutStyle.alignCenter]}>
            <Text style={styles.infoLabel}>닉네임</Text>
            <View style={[styles.infoValueContainer, layoutStyle.row, layoutStyle.alignCenter]}>
              <Text style={styles.infoText}>{memberInfo?.mem_nickname}</Text>
              <TouchableOpacity
                style={[layoutStyle.row, commonStyle.ml10, styles.editButton]}
                onPress={() => navigation.navigate('NicknameChange' as never)}
              >
                <Text style={[styles.infoText, {fontSize: scale(10), fontFamily: 'Pretendard-Medium'}]}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[layoutStyle.row, commonStyle.mt10, layoutStyle.alignCenter]}>
            <Text style={styles.infoLabel}>아이디</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoText}>{memberInfo?.mem_app_id}</Text>
            </View>
          </View>
          <View style={[layoutStyle.row, commonStyle.mt10, layoutStyle.alignCenter]}>
            <Text style={styles.infoLabel}>전화번호</Text>
            <View style={styles.infoValueContainer}>
            <Text style={styles.infoText}>{formatPhone344(memberInfo?.mem_phone)}</Text>
            </View>
          </View>
          <View style={[layoutStyle.row, commonStyle.mt10, layoutStyle.alignCenter]}>
            <Text style={styles.infoLabel}>회원번호</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoText}>{memberInfo?.mem_checkin_number}</Text>
            </View>
          </View>
          {memberOrders.length > 0 && (
            <View style={[commonStyle.mt10, layoutStyle.row, layoutStyle.alignStart]}>
              <Text style={styles.infoLabel}>회원권</Text>
              <View style={styles.infoValueContainer}>
              {memberOrders.map((e, i) => (
                <Text key={`mo_${i}`} style={styles.infoText}>
                  {memberOrders.length > 1 ? `${i + 1}. ` : ''}{(e?.memo_pro_name || e?.product_name) || '-'} {(() => {
                    const start_dt = String(e?.memo_start_date || '').split('T')[0];
                    const end_dt = String(e?.memo_end_date || '').split('T')[0];
                    return e?.pro_type === '회차권'
                      ? `(${e?.memo_remaining_counts ?? 0}회) (${start_dt} ~ ${end_dt})`
                      : `(${start_dt} ~ ${end_dt})`;
                  })()}
                </Text>
              ))}
              </View>
            </View>
          )}
          {memberInfo?.mem_role === 'FRANCHISEE' && (
            <View style={[layoutStyle.row, commonStyle.mt10, layoutStyle.alignCenter]}>
              <Text style={styles.infoLabel}>회원유형</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoText}>가맹점주</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={[commonStyle.pl16, commonStyle.pr16, commonStyle.mb20]}>
        <TouchableOpacity 
          style={[commonStyle.mb15, styles.logoutContainer]}
          onPress={() => navigation.navigate('PasswordChange' as never)}
        >
          <Text style={styles.menuText}>비밀번호 변경</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[commonStyle.mb15, styles.logoutContainer]}
          onPress={() => showPopup('로그아웃', '정말 로그아웃 하시겠습니까?', 'logout')}
        >
          <Text style={styles.menuText}>로그아웃</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.withdrawalContainer}
          onPress={() => showPopup('회원탈퇴', '정말 회원탈퇴 하시겠습니까?', 'withdrawal')}
        >
          <Text style={styles.withdrawalText}>회원탈퇴</Text>
        </TouchableOpacity>
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
  infoText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Regular',
    fontSize: scale(12),
    marginBottom: scale(2),
  },
  infoLabel: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Regular',
    fontSize: scale(12),
    width: '20%',
  },
  infoValueContainer: {
    width: '80%',
  },
  editButton: {
    backgroundColor: '#444444',
    paddingVertical: scale(3),
    paddingHorizontal: scale(5),
    borderRadius: scale(3),
  },
  menuText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scale(12),
  },
  withdrawalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingVertical: scale(15),
    borderRadius: scale(8),
  },
  withdrawalText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scale(12),
  },
  logoutContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444444',
    paddingVertical: scale(15),
    borderRadius: scale(8),
  },
  menuArrow: {
    width: scale(16),
    height: scale(16),
    tintColor: '#999999',
  },
});

export default Settings; 