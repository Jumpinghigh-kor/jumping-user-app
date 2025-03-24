import React, {useState, useEffect, useRef} from 'react';
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
import {getMemberOrdersList, GetMemberOrderResponse} from '../api/services/orderService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import CommonPopup from '../components/CommonPopup';
import {MemberOrder} from '../types/order.types';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';

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
    onConfirm: () => void;
    onCancel?: () => void;
    showOrders?: boolean;
    confirmText?: string;
  }>({
    visible: false,
    message: '',
    onConfirm: () => {},
  });

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
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
        console.error('Failed to fetch orders:', error);
      }
    };

    fn_getMemberOrders();
  }, []);
  
  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig({...config, visible: true});
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({...prev, visible: false, showOrders: false}));
  };

  const handleNumberPress = (num: string) => {
    if (inputNumber.length < 6) {
      setInputNumber(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setInputNumber(prev => prev.slice(0, -1));
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // iOS에서는 Alert을 짧게 표시
      Alert.alert('', message, [{ text: 'OK', style: 'cancel' }], { cancelable: true });
    }
  };

  // 출석 처리 함수
  const processAttendance = async (memId: string, selectedOrder: MemberOrder) => {
    try {
      // 출석 처리 API 호출
      const response = await insertCheckinLog({
        mem_id: parseInt(memId, 10),
        ci_password: inputNumber,
        memo_id: selectedOrder.memo_id,
        pro_type: selectedOrder.pro_type,
        center_id: selectedOrder.center_id,
      });
      
      if (response.success) {
        hideAlert();
        showToast('출석체크가 완료되었습니다.');
        navigation.goBack();
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

      console.log('validateResponse::', validateResponse);

      if (!validateResponse.success) {
        showAlert({
          visible: true,
          message: validateResponse.message || '잘못된 출입 번호입니다.',
          onConfirm: hideAlert,
        });
        return;
      }

      if (orderList.length === 0) {
        showAlert({
          visible: true,
          message: '회원권을 먼저 구매하셔야 합니다.',
          confirmText: '회원권 보러가기',
          onConfirm: () => {
            hideAlert();
            navigation.navigate('MainTab', { screen: 'Membership' });
          },
        });
        return;
      }

      showAlert({
        visible: true,
        message: '회원권 선택',
        showOrders: true,
        confirmText: '선택',
        onConfirm: async () => {
          console.log('onConfirm selectedOrderId::', selectedOrderId);
          console.log('onConfirm selectedOrderIdRef::', selectedOrderIdRef.current);
          
          // ref를 사용하여 선택된 회원권 ID 확인
          const currentOrderId = selectedOrderIdRef.current;
          
          if (!currentOrderId) {
            showToast('회원권을 선택해주세요.');
            return;
          }
          
          // 선택된 회원권 찾기
          const currentSelectedOrder = orderList.find(order => order.memo_id === currentOrderId);
          console.log('currentSelectedOrder::', currentSelectedOrder);

          if (!currentSelectedOrder) {
            showToast('선택된 회원권 정보를 찾을 수 없습니다.');
            return;
          }
          
          // 출석 처리 함수 호출
          await processAttendance(memId, currentSelectedOrder);
        },
        onCancel: hideAlert,
      });

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

  // selectedOrderId가 변경될 때마다 로그 출력
  useEffect(() => {
    if (selectedOrderId !== null) {
      console.log('selectedOrderId changed:', selectedOrderId);
    }
  }, [selectedOrderId]);

  const renderOrderInfo = () => {
    if (!alertConfig.showOrders || orderList.length === 0) return null;

    return (
      <ScrollView 
        style={styles.orderScrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.orderScrollContent}
      >
        <Text style={styles.orderTitle}>
          이용하실 회원권을 선택해주세요.
        </Text>
        {orderList.map((order, index) => (
          <TouchableOpacity
            key={order.memo_id || index}
            style={[
              styles.orderItem,
              selectedOrderId === order.memo_id && styles.selectedOrder,
            ]}
            onPress={() => {
              console.log('Order selected:', order.memo_id);
              setSelectedOrderId(order.memo_id);
              selectedOrderIdRef.current = order.memo_id;
            }}>
            <Text style={styles.orderText}>
              상품명: {order.memo_pro_name || order.product_name}
            </Text>
            {order.pro_type === '회차권' ? (
              <Text style={styles.orderText}>
                남은 횟수: {order.memo_remaining_counts}회
              </Text>
            ) : (
              <Text style={styles.orderText}>
                기간: {order.memo_start_date || order.start_date} ~{' '}
                {order.memo_end_date || order.end_date}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
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
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      >
        {renderOrderInfo()}
      </CommonPopup>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  inputDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  orderText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(20),
    color: '#000000',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    fontSize: scale(24),
    fontWeight: '500',
    textAlign: 'center',
    color: '#000000',
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keypadButton: {
    width: (Dimensions.get('window').width - 80) / 3,
    height: scale(58),
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
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
    fontWeight: '500',
    color: '#000000',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  selectedOrder: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  orderScrollView: {
    maxHeight: 200,
    marginTop: 10,
  },
  orderScrollContent: {
    paddingHorizontal: 5,
    paddingBottom: 10,
  },
  orderItem: {
    backgroundColor: '#333639',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    marginTop: scale(80),
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