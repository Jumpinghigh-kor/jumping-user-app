import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  ScrollView,
  ToastAndroid,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {validateMemberNumber, insertCheckinLog} from '../api/services/checkinService';
import {getMemberOrdersList, GetMemberOrderResponse} from '../api/services/memberOrdersService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import CommonPopup from '../components/CommonPopup';
import MemberOrdersPopup from '../components/MemberOrdersPopup';
import {MemberOrder} from '../types/order.types';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { getMemberAttendanceAppList, insertMemberAttendanceApp } from '../api/services/memberAttendanceAppService';
import CustomToast from '../components/CustomToast';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const Attendance = () => {
  const [inputNumber, setInputNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState<MemberOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const selectedOrderIdRef = useRef<number | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    message: string;
    type?: 'default' | 'warning' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
    showOrders?: boolean;
    confirmText?: string;
  }>({
    visible: false,
    message: '',
    onConfirm: () => {},
  });

  const [showMemberOrdersPopup, setShowMemberOrdersPopup] = useState(false);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState('');

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      setInputNumber(''); // 화면 포커스 시 입력 번호 초기화
      
      const fn_getMemberOrders = async () => {
        try {
          const memId = await AsyncStorage.getItem('mem_id');
          if (memId) {
            const memberOrdersResponse = await getMemberOrdersList({
              mem_id: parseInt(memId, 10),
            }) as GetMemberOrderResponse;

            if (memberOrdersResponse.success && memberOrdersResponse.data) {
              setOrderList(memberOrdersResponse.data);
            }
          }
        } catch (error) {
        }
      };

      fn_getMemberOrders();
      
      return () => {
        // cleanup if needed
      };
    }, [])
  );
  
  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig({...config, visible: true});
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({...prev, visible: false, showOrders: false}));
  };

  const handleNumberPress = (num: string) => {
    if (inputNumber.length < 8) {
      setInputNumber(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setInputNumber(prev => prev.slice(0, -1));
  };

  const showToast = (message: string) => {
    setCustomToastMessage(message);
    setShowCustomToast(true);
  };

  // 출석 처리 함수
  const processAttendance = async (memId: string, selectedOrder: MemberOrder) => {
    try {
      // 출석 처리 API 호출
      const response = await insertCheckinLog({
        mem_id: parseInt(memId, 10),
        // ci_password: inputNumber,
        memo_id: selectedOrder.memo_id,
        pro_type: selectedOrder.pro_type,
        center_id: selectedOrder.center_id,
      });
      
      if (response.success) {
        hideAlert();
        
        // 입력 번호 초기화
        setInputNumber('');
        
        // 회원권 목록 다시 조회
        const memberOrdersResponse = await getMemberOrdersList({
          mem_id: parseInt(memId, 10),
        }) as GetMemberOrderResponse;

        if (memberOrdersResponse.success && memberOrdersResponse.data) {
          setOrderList(memberOrdersResponse.data);
        }
        
        // CommonPopup으로 출석 완료 메시지 표시
        showAlert({
          visible: true,
          message: '출석체크가 완료되었습니다.',
          onConfirm: hideAlert,
        });
        
      } else {
        showToast(response.message || '출석 처리 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      showToast(error.message || '출석 처리 중 오류가 발생했습니다.');
    }
  };
  
  const handleSubmit = async () => {
    if (inputNumber.length < 4) {
      showAlert({
        visible: true,
        message: '4자리 번호 이상 입력해주세요.',
        type: 'warning',
        onConfirm: hideAlert,
      });
      return;
    }

    try {
      setLoading(true);
      const memId = await AsyncStorage.getItem('mem_id');
      
      if (!memId) {
        showAlert({
          visible: true,
          message: '로그인이 필요합니다.',
          onConfirm: hideAlert,
        });
        return;
      }

      // 1. 회원 번호 유효성 체크
      const validateResponse = await validateMemberNumber({
        mem_id: parseInt(memId, 10),
        mem_checkin_number: inputNumber,
      });

      if (!validateResponse.success) {
        showAlert({
          visible: true,
          message: validateResponse.message || '잘못된 출입 번호입니다.',
          onConfirm: hideAlert,
          type: 'warning',
        });
        return;
      }

      if (orderList.length === 0) {
        showAlert({
          visible: true,
          message: '회원권을 먼저 구매하셔야 합니다.',
          confirmText: '회원권 보러가기',
          type: 'warning',
          onConfirm: () => {
            hideAlert();
            navigation.navigate('MainTab', { screen: 'Membership' });
          },
        });
        return;
      }

      // MemberOrdersPopup 표시
      setSelectedOrderId(null);
      selectedOrderIdRef.current = null;
      setShowMemberOrdersPopup(true);

    } catch (error: any) {
      showAlert({
        visible: true,
        message: error.message || '출석 처리 중 오류가 발생했습니다.',
        onConfirm: hideAlert,
      });
    } finally {
      setLoading(false);
      // 출석번호 입력값 유지 (주석 처리)
      // setInputNumber('');
    }
  };

  // 회원권 선택 완료 처리
  const handleOrderConfirm = async () => {
    if (!selectedOrderId) {
      showToast('회원권을 선택해주세요.');
      return;
    }
    
    // 선택된 회원권 찾기
    const currentSelectedOrder = orderList.find(order => order.memo_id === selectedOrderId);
    
    if (!currentSelectedOrder) {
      showToast('선택된 회원권 정보를 찾을 수 없습니다.');
      return;
    }
    
    const memId = await AsyncStorage.getItem('mem_id');
    if (!memId) {
      showToast('로그인 정보를 찾을 수 없습니다.');
      return;
    }
    
    // 출석 처리 함수 호출
    await processAttendance(memId, currentSelectedOrder);
    setShowMemberOrdersPopup(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일</Text>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <Text style={styles.subtitle}>출석 체크를 위해 출입 번호를 입력해 주세요.</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputNumber}
          editable={false}
          placeholderTextColor="#999"
        />
      </View>

      <View>
        <View style={styles.keypadRow}>
          {[1, 2, 3].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(num.toString())}>
              <Text style={styles.keypadText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {[4, 5, 6].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(num.toString())}>
              <Text style={styles.keypadText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {[7, 8, 9].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(num.toString())}>
              <Text style={styles.keypadText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={[styles.keypadButton, {backgroundColor: '#C4C4C4'}]} onPress={handleDelete}>
            <Image
              source={IMAGES.icons.arrowLeftFullWhite}
              style={styles.arrowKeypad}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('0')}>
            <Text style={styles.keypadText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.keypadButton, styles.submitButton]} 
            onPress={handleSubmit}
            disabled={loading}>
            <Text style={styles.submitText}>출석</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={IMAGES.logo.jumpingBlack}
            style={styles.logoImage}
          />  
        </View>
      </View>

      <CommonPopup
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        backgroundColor="#FFFFFF"
        textColor="#000000"
      />

      <MemberOrdersPopup
        visible={showMemberOrdersPopup}
        message="이용하실 회원권을 선택해주세요."
        orderList={orderList}
        selectedOrderId={selectedOrderId}
        onSelect={(orderId) => {
          setSelectedOrderId(orderId);
          selectedOrderIdRef.current = orderId;
        }}
        onConfirm={handleOrderConfirm}
        onCancel={() => setShowMemberOrdersPopup(false)}
      />

      {/* 커스텀 토스트 */}
      <CustomToast
        visible={showCustomToast}
        message={customToastMessage}
        onHide={() => setShowCustomToast(false)}
        position="top"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: scale(20),
    flexDirection: 'column',
    justifyContent: 'center',
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: scale(30),
  },
  inputDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scale(20),
  },
  orderTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  orderText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
    color: '#CCCCCC',
    marginBottom: scale(4),
  },
  subtitle: {
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(20),
    color: '#000000',
    fontFamily: 'Pretendard-SemiBold',
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: scale(8),
    fontSize: scale(24),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    color: '#000000',
    width: '100%',
    height: scale(50),
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  keypadButton: {
    width: (Dimensions.get('window').width - scale(70)) / 3,
    height: scale(58),
    backgroundColor: '#F0F0F0',
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowKeypad: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  keypadText: {
    fontSize: scale(22),
    fontFamily: 'Pretendard-Medium',
    color: '#000000',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitText: {
    fontSize: scale(20),
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },
  selectedOrder: {
    borderColor: '#007AFF',
    borderWidth: scale(2),
  },
  orderScrollView: {
    maxHeight: scale(200),
    marginTop: scale(10),
  },
  orderScrollContent: {
    paddingHorizontal: scale(5),
    paddingBottom: scale(10),
  },
  orderItem: {
    backgroundColor: '#333639',
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#444444',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(36, 37, 39, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  logoContainer: {
    alignItems: 'flex-end',
    marginTop: scale(20),
  },
  logoImage: {
    width: scale(80),
    height: scale(40),
    resizeMode: 'contain',
  },
  dateText: {
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(10),
    color: '#000000',
  },
});

export default Attendance; 