import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import { layoutStyle, commonStyle } from '../assets/styles/common';
import { TextInput } from 'react-native-gesture-handler';
import { useAppSelector } from '../store/hooks';
import { getTargetMemberShippingAddress, updateDeliveryRequest, updateSelectYn } from '../api/services/memberShippingAddressService';
import {getCommonCodeList} from '../api/services/commonCodeService';
import { getMemberCouponAppList, updateMemberCouponApp } from '../api/services/memberCouponApp';
import CommonPopup from '../components/CommonPopup';
import CommonModal from '../components/CommonModal';
import { usePopup } from '../hooks/usePopup';
import { toggleCheckbox } from '../utils/commonFunction';
import Portone from '../components/Portone';
import { verifyPayment } from '../api/services/portoneService';
import { insertMemberOrderApp, insertMemberOrderDetailApp } from '../api/services/memberOrderAppService';
import { insertMemberOrderAddress } from '../api/services/memberOrderAddressService';
import { insertMemberPaymentApp } from '../api/services/memberPaymentAppService';
import { insertMemberPointApp } from '../api/services/memberPointAppService';
import { isCJRemoteArea } from '../constants/postCodeData';
import { thirdPrivacyTextFirst, thirdPrivacyTextSecond, thirdPrivacyTextThird } from '../constants/thirdPrivacy';
import { paymentPrivacyText } from '../constants/paymentPrivacy';

type ShoppingPaymentRouteParams = {
  selectedItems: Array<any>;
  shippingAddressId?: number;
};

const ShoppingPayment = () => {
  const route = useRoute<RouteProp<Record<string, ShoppingPaymentRouteParams>, string>>();
  const navigation = useNavigation();
  const { selectedItems = [], shippingAddressId } = route.params || {};
  const [isOpen, setIsOpen] = useState(true);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [deliveryRequestTypes, setDeliveryRequestTypes] = useState([]);
  const [isOpenDeliveryRequest, setIsOpenDeliveryRequest] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  const [customRequestText, setCustomRequestText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saveForNextTime, setSaveForNextTime] = useState(false);
  const { popup, showWarningPopup, showConfirmPopup } = usePopup();
  const [isAgreedToOrder, setIsAgreedToOrder] = useState(false);
  const [isAgreedToPrivacy, setIsAgreedToPrivacy] = useState(false);
  const [isAgreedToThirdParty, setIsAgreedToThirdParty] = useState(false);
  const [isAgreedToPayment, setIsAgreedToPayment] = useState(false);
  const [showPortone, setShowPortone] = useState(false);
  const [agreementModalVisible, setAgreementModalVisible] = useState(false);
  const [pointInput, setPointInput] = useState('');
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);
  // 개별 약관 모달
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [thirdPartyModalVisible, setThirdPartyModalVisible] = useState(false);
  const [paymentTermsModalVisible, setPaymentTermsModalVisible] = useState(false);
  const [entrancePwModalVisible, setEntrancePwModalVisible] = useState(false);
  const [isAgreedToEntrancePw, setIsAgreedToEntrancePw] = useState(false);
  const [couponList, setCouponList] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isOpenCoupon, setIsOpenCoupon] = useState(false);
  const totalRows = thirdPrivacyTextThird.length;
  const entrustRows: string[][] = [
    ['개인정보 취급 위탁', '업무의 내용', '개인정보 보유 및 이용기간'],
    ['(주)굿스플로', '배송정보 안내서비스 제공', '위탁 업무 종료시까지'],
  ];
  
  // 뒤로가기 처리 함수
  const handleBackPress = async () => {
    // 선택된 배송지가 있으면 updateSelectYn 호출
    if (selectedAddress) {
      try {
        await updateSelectYn({
          mem_id: memberInfo?.mem_id,
          shipping_address_id: selectedAddress.shipping_address_id,
          select_yn: 'N'
        });
        
      } catch (error) {
        console.error('배송지 선택 해제 실패:', error);
      }
    } else {
    }
    navigation.goBack();
  };
  
  // 배송지 조회
  const fetchShippingAddresses = async () => {
    try {
      const response = await getTargetMemberShippingAddress({
        mem_id: memberInfo?.mem_id
      });
      
      if (response.success && response.data) {
        const addresses = Array.isArray(response.data) ? response.data : [response.data];
        setShippingAddresses(addresses);
        
        const defaultAddress = addresses.find(addr => addr.default_yn === 'Y');
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else if (addresses.length > 0) {
          setSelectedAddress(addresses[0]);
        }
      }
    } catch (error) {
      
    } finally {
    }
  };
  
  // 배송 요청 유형 조회
  const fetchDeliveryRequestTypes = async () => {
    try {
      const response = await getCommonCodeList({ group_code: 'REQUEST_SHIPPING_TYPE' });
      if (response.success && response.data) {
        setDeliveryRequestTypes(response.data);
      }
    } catch (error) {
      
    }
  };

  // 쿠폰 목록 조회
  const fetchCouponList = async () => {
    try {
      const response = await getMemberCouponAppList({
        mem_id: memberInfo?.mem_id,
        use_yn: 'N',
        date: 'Y',
      });
      if (response.success && response.data) {
        setCouponList(response.data);
      }
    } catch (error) {
      console.error('쿠폰 목록 조회 실패:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchShippingAddresses();
      fetchDeliveryRequestTypes();
      fetchCouponList();
    }, [])
  );

  // 총 주문 금액 계산
  const getTotalAmount = () => {
    try {
      return (selectedItems || []).reduce((sum: number, it: any) => {
        const original = parseInt(String(it?.original_price ?? '0').replace(/,/g, ''), 10) || 0;
        const qty = Number(it?.quantity || 0);
        return sum + (original * qty);
      }, 0);
    } catch {
      return 0;
    }
  };

  // 장바구니와 동일 정책: consignment_yn === 'N' 중 최대 배송비, 없으면 전체 중 최대
  const getMaxDeliveryFee = () => {
    try {
      const toNum = (v: any) => Number(String(v ?? 0).replace(/[^0-9]/g, '')) || 0;
      return (selectedItems || [])
        .filter((it: any) => String(it?.consignment_yn) === 'N')
        .reduce((max: number, it: any) => {
          const fee = toNum(it?.delivery_fee);
          return fee > max ? fee : max;
        }, 0);
    } catch {
      return 0;
    }
  };

  // 도서산간 추가 배송비 (consignment_yn === 'N' 중 최대)
  const getMaxRemoteDeliveryFee = () => {
    try {
      const toNum = (v: any) => Number(String(v ?? 0).replace(/[^0-9]/g, '')) || 0;
      return (selectedItems || [])
        .filter((it: any) => String(it?.consignment_yn) === 'N')
        .reduce((max: number, it: any) => {
          const fee = toNum(it?.remote_delivery_fee);
          return fee > max ? fee : max;
        }, 0);
    } catch {
      return 0;
    }
  };

  // 상품 할인(선할인) 표시에 사용할 price 총합
  const getTotalPriceSum = () => {
    try {
      return (selectedItems || []).reduce((sum: number, it: any) => {
        const price = parseInt(String(it?.price ?? '0').replace(/,/g, ''), 10) || 0;
        const qty = Number(it?.quantity || 0);
        return sum + (price * qty);
      }, 0);
    } catch {
      return 0;
    }
  };

  // 쿠폰 할인 금액: 특정 상품 쿠폰이면 해당 상품 price 합만, 전체 쿠폰이면 전체 price 합에서 계산
  const getCouponDiscountAmount = () => {
    try {
      if (!selectedCoupon) return 0;
      const toNum = (v: any) => parseInt(String(v ?? '0').replace(/,/g, ''), 10) || 0;
      const targetProductId = Number(selectedCoupon?.product_app_id || 0);
      const base = (selectedItems || [])
        .filter((it: any) => !targetProductId || Number(it?.product_app_id) === targetProductId)
        .reduce((sum: number, it: any) => sum + (toNum(it?.price) * Number(it?.quantity || 0)), 0);
      const discType = String(selectedCoupon?.discount_type || '').toUpperCase();
      const discAmt = Number(selectedCoupon?.discount_amount || 0);
      let discount = 0;
      if (discType === 'PERCENT') {
        discount = Math.floor(base * (discAmt / 100));
      } else {
        discount = Math.min(base, discAmt);
      }
      return Math.max(0, discount);
    } catch {
      return 0;
    }
  };

  // 선택된 상품들 중 무료배송 기준의 최대값
  const getMaxFreeShippingThreshold = () => {
    try {
      const toNum = (v: any) => Number(String(v ?? 0).replace(/[^0-9]/g, '')) || 0;
      return (selectedItems || []).reduce((max: number, it: any) => {
        const th = toNum(it?.free_shipping_amount);
        return th > max ? th : max;
      }, 0);
    } catch {
      return 0;
    }
  };

  // 최종 결제 금액 계산 (쿠폰, 포인트 할인 적용)
  const getFinalPaymentAmount = () => {
    try {
      const pointVal = parseInt(String(pointInput || '0').replace(/[^0-9]/g, ''), 10) || 0;
      const couponVal = getCouponDiscountAmount();
      const base = Math.max(0, getTotalPriceSum() - pointVal - couponVal);
      const threshold = getMaxFreeShippingThreshold();
      const shippingFee = (threshold > 0 && base >= threshold) ? 0 : getMaxDeliveryFee();
      const remoteFee = (selectedAddress?.zip_code && isCJRemoteArea(selectedAddress.zip_code)) ? getMaxRemoteDeliveryFee() : 0;
      return Math.max(0, base + shippingFee + remoteFee);
    } catch {
      return 0;
    }
  };

  const displayUnit = (unit: any) => {
    try {
      const u = String(unit ?? '');
      if (!u || u === 'NONE_UNIT') return '';
      if (u.startsWith('SIZE_')) return u.replace(/^SIZE_/, '');
      return u;
    } catch {
      return String(unit ?? '');
    }
  };

  // 배송지 변경 함수
  const handleUpdateDeliveryRequest = async () => {
    if (!selectedAddress) {
      showWarningPopup('배송지를 먼저 선택해주세요');
      return;
    }
    
    try {
      if (saveForNextTime) {
        try {
          const response = await updateDeliveryRequest({
            shipping_address_id: selectedAddress.shipping_address_id,
            mem_id: memberInfo?.mem_id,
            delivery_request: ''
          });
          
          if (response.success) {
            setSaveForNextTime(false);
          } else {
            showWarningPopup('배송 요청사항 저장 취소에 실패했습니다.');
          }
        } catch (error) {
          showWarningPopup('배송 요청사항 저장 취소 중 오류가 발생했습니다.');
        }
        return;
      }

      const deliveryRequest = showCustomInput 
        ? customRequestText 
        : (selectedRequestType ? selectedRequestType.common_code_name : '');
      
      const response = await updateDeliveryRequest({
        shipping_address_id: selectedAddress.shipping_address_id,
        mem_id: memberInfo?.mem_id,
        delivery_request: deliveryRequest
      });
      
      if (response.success) {
        setSaveForNextTime(true);
      } else {
        showWarningPopup('배송 요청사항 저장에 실패했습니다.');
        setSaveForNextTime(false);
      }
    } catch (error) {
      showWarningPopup('배송 요청사항 저장 중 오류가 발생했습니다.');
      setSaveForNextTime(false);
    }
  };
  
  // 결제하기
  const handlePayment = () => {
    if (!isAgreedToOrder || !isAgreedToPrivacy || !isAgreedToThirdParty || !isAgreedToPayment) {
      showWarningPopup('모든 필수 약관에 동의해주세요');
      return;
    }
    
    if (!selectedAddress) {
      showWarningPopup('배송지를 먼저 선택해주세요');
      return;
    }

    setShowPortone(true);
  };

  // 포트원 결제
  const paymentData = {
    amount: getFinalPaymentAmount(),
    currency: 'KRW',
    merchantOrderId: `jhp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    customerName: memberInfo?.mem_name || '',
    customerEmail: memberInfo?.mem_app_id || '',
    customerPhone: memberInfo?.mem_phone || '',
    description: '점핑하이 쇼핑몰 상품 주문'
  };

  

  const handlePortonePaymentSuccess = async (result: any) => {
    try {
      // 1) 서버 결제 검증
      await verifyPayment({ imp_uid: result.imp_uid });

      // 2) 주문 생성 (order_app)
      const orderAppRes = await insertMemberOrderApp({
        mem_id: Number(memberInfo?.mem_id)
      } as any);
      const order_app_id = (orderAppRes as any)?.order_app_id ?? (orderAppRes as any)?.data?.order_app_id;

      // 3) 주문 상세 생성 + 상세별 배송지 저장
      const deliveryRequest = showCustomInput
        ? customRequestText
        : (selectedRequestType ? selectedRequestType.common_code_name : '');

      for (const item of selectedItems) {
        const orderDetailRes = await insertMemberOrderDetailApp({
          order_app_id,
          product_detail_app_id: item.product_detail_app_id,
          order_status: 'PAYMENT_COMPLETE',
          order_group: 1,
          order_quantity: item.quantity,
          mem_id: Number(memberInfo?.mem_id)
        } as any);
        const order_detail_app_id = (orderDetailRes as any)?.order_detail_app_id ?? (orderDetailRes as any)?.data?.order_detail_app_id;

        await insertMemberOrderAddress({
          order_detail_app_id,
          mem_id: Number(memberInfo?.mem_id),
          order_address_type: 'ORDER',
          receiver_name: selectedAddress.receiver_name,
          receiver_phone: selectedAddress.receiver_phone.replace(/-/g, ''),
          address: selectedAddress.address,
          address_detail: selectedAddress.address_detail,
          zip_code: selectedAddress.zip_code,
          enter_way: selectedAddress.enter_way,
          enter_memo: selectedAddress.enter_memo,
          delivery_request: deliveryRequest
        });
      }

      // 4) 결제 저장 (order_app_id 포함)
      await insertMemberPaymentApp({
        order_app_id,
        mem_id: Number(memberInfo?.mem_id),
        payment_status: 'PAYMENT_COMPLETE',
        payment_type: 'PRODUCT_BUY',
        payment_method: result?.pay_method || 'card',
        payment_amount: getFinalPaymentAmount(),
        portone_imp_uid: result.imp_uid,
        portone_merchant_uid: paymentData.merchantOrderId,
        portone_status: 'SUCCESS',
        card_name: result.card_name || 'PORTONE'
      } as any);

      // 5) 포인트 사용 시 차감 기록
      if (pointInput) {
        await insertMemberPointApp({
          order_app_id,
          mem_id: Number(memberInfo?.mem_id),
          point_amount: parseInt(pointInput),
          point_status: 'POINT_MINUS'
        } as any);
      }

      // 6) 쿠폰 사용 시 사용 처리
      if (selectedCoupon?.member_coupon_app_id) {
        await updateMemberCouponApp(
          Number(selectedCoupon.member_coupon_app_id),
          Number(order_app_id),
          Number(memberInfo?.mem_id),
          'Y'
        );
      }

      setShowPortone(false);
      setSuccessPopupVisible(true);
    } catch (error: any) {
      const errMsg = error?.response?.message || error?.message || 'Unknown error';
      console.error('결제 처리 실패:', errMsg);
      setShowPortone(false);
      showWarningPopup('결제 처리 중 오류가 발생했습니다.\n고객센터에 문의해주세요');
    }
  };

  if (showPortone) {
    return (
      <Portone
        visible={showPortone}
        paymentData={paymentData}
        onPaymentSuccess={(result) => {
          handlePortonePaymentSuccess(result);
        }}
        onPaymentFailure={(error) => {
          console.log('결제 실패:', error);
          setShowPortone(false);
          showWarningPopup('결제에 실패했습니다.\n다시 시도해주세요');
        }}
        onCancel={() => {
          setShowPortone(false);
        }}
      />
    );
  }
  
  return (
    <>
      <CommonHeader 
        title="주문/결제"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        onBackPress={handleBackPress}
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: scale(20)}}
        >
          <View style={styles.addressContainer}>
            <View style={[layoutStyle.rowBetween]}>
              <Text style={styles.addressTitle}>배송지</Text>
              <TouchableOpacity
                style={styles.addressChangeBtn}
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate('ShoppingAddress', {
                    screen: 'ShoppingPayment',
                    shippingAddressId: selectedAddress?.shipping_address_id
                  });
                }}
              >
                <Text style={styles.addressChangeBtnText}>배송지 선택</Text>
              </TouchableOpacity>
            </View>
            {selectedAddress ? (
              <View>
                <View style={[commonStyle.mt10]}>
                  <Text style={styles.addressName}>{selectedAddress.shipping_address_name}</Text>
                </View>
                <View style={[layoutStyle.rowStart]}>
                  <Text style={[styles.receiverInfo ,{color: '#202020', fontWeight: '500', marginRight: scale(10)}]}>{selectedAddress.receiver_name}</Text>
                  <Text style={styles.receiverInfo}>{selectedAddress.receiver_phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</Text>
                </View>
                <Text style={styles.addressText}>
                  {selectedAddress.address} {selectedAddress.address_detail}
                </Text>
                <View style={[styles.selectContainer]}>
                  <TouchableOpacity
                    style={styles.requestContainer}
                    onPress={() => setIsOpenDeliveryRequest(!isOpenDeliveryRequest)}
                  >
                    <Text style={styles.requestText}>
                      {showCustomInput 
                        ? '직접 입력' 
                        : (selectedRequestType ? selectedRequestType.common_code_name : '배송 시 요청사항을 선택해주세요')}
                    </Text>
                    <Image source={isOpenDeliveryRequest ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} style={{width: scale(14), height: scale(14), resizeMode: 'contain'}} />
                  </TouchableOpacity>
                  
                  {isOpenDeliveryRequest && (
                    <View style={styles.dropdownContainer}>
                      {deliveryRequestTypes.map((item, index) => (
                        <TouchableOpacity 
                          key={item.common_code}
                          style={[
                          layoutStyle.rowStart, 
                          { 
                            padding: scale(10),
                            borderTopWidth: index > 0 ? 1 : 0,
                            borderTopColor: '#848484',
                            width: '100%',
                            backgroundColor: selectedRequestType?.common_code === item.common_code ? '#F5F5F5' : '#FFFFFF'
                          }
                        ]}
                        onPress={() => {
                          if (item.common_code_name === '직접 입력') {
                            setShowCustomInput(true);
                            setSelectedRequestType(null);
                          } else {
                            setShowCustomInput(false);
                            setSelectedRequestType(item);
                          }
                          setIsOpenDeliveryRequest(false);
                        }}
                        >
                          <Text style={[
                            styles.requestText,
                            selectedRequestType?.common_code === item.common_code ? { fontWeight: '500' } : {}
                          ]}>
                            {item.common_code_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      
                      {/* Add direct input option if it doesn't exist in the API data */}
                      {!deliveryRequestTypes.some(item => item.common_code_name === '직접 입력') && (
                        <TouchableOpacity 
                        style={[
                          layoutStyle.rowStart, 
                          { 
                            padding: scale(10),
                            borderTopWidth: 1,
                            borderTopColor: '#EEEEEE',
                            width: '100%',
                            backgroundColor: showCustomInput ? '#F5F5F5' : '#FFFFFF'
                          }
                        ]}
                        onPress={() => {
                          setShowCustomInput(true);
                          setSelectedRequestType(null);
                          setIsOpenDeliveryRequest(false);
                        }}
                        >
                          <Text style={[
                            styles.requestText,
                            showCustomInput ? { fontWeight: '500' } : {}
                          ]}>
                            직접 입력
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {showCustomInput && (
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#848484',
                      borderRadius: scale(10),
                      padding: scale(10),
                      fontSize: scale(12),
                      marginTop: scale(10),
                      color: '#202020'
                    }}
                    placeholder="배송 요청사항을 입력해주세요"
                    value={customRequestText}
                    onChangeText={setCustomRequestText}
                    multiline={true}
                    maxLength={50}
                    numberOfLines={1}
                  />
                )}

                <TouchableOpacity 
                  style={[layoutStyle.rowStart, commonStyle.mt10]}
                  onPress={() => {
                    // Validate if a delivery request is selected or entered
                    if ((!selectedRequestType && !showCustomInput) || 
                        (showCustomInput && !customRequestText.trim())) {
                      showWarningPopup('배송 시 요청사항을 먼저 선택해주세요');
                      return;
                    }
                    
                    // Update delivery request via API
                    handleUpdateDeliveryRequest();
                  }}
                >
                  <Image 
                    source={saveForNextTime ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} 
                    style={{width: scale(14), height: scale(14), resizeMode: 'contain', marginRight: scale(5)}} 
                  />
                  <Text style={[styles.requestText]}>
                    다음에도 사용할게요
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addressAddBtn}
                // @ts-ignore
                onPress={() => navigation.navigate('ShoppingAddressAdd', {
                  screen: 'ShoppingPayment'
                })}
              >
                <Text style={styles.addressBtnText}>배송지 추가</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.orderContainer}>
            <TouchableOpacity
              style={[layoutStyle.rowBetween]}
              onPress={() => setIsOpen(!isOpen)}
            >
              <Text style={styles.orderTitle}>총 주문 상품 {selectedItems.length}개</Text>
              <Image source={isOpen ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} style={styles.arrowDown} />
            </TouchableOpacity>

            {isOpen && (
              <>
                {selectedItems.map((item, index) => {
                  return(
                    <View key={item.product_app_id + '_' + index} style={styles.itemContainer}>
                      <View style={styles.itemRow}>
                        <ShoppingThumbnailImg 
                          productAppId={item.product_app_id}
                          width={scale(70)} 
                          height={scale(70)}
                          style={styles.thumbnail}
                        />
                        <View style={styles.itemInfo}>
                          <Text style={styles.brandName}>{item.brand_name}</Text>
                          <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                          <Text style={styles.priceText}>{(item.price * item.quantity).toLocaleString()}원</Text>
                        </View>
                      </View>
                      <View style={styles.optionContainer}>
                          <Text style={styles.optionText}>
                          {item.product_name} {item.option_gender && (item.option_gender === 'W' ? '여성' : item.option_gender === 'M' ? '남성' : item.option_gender === 'A' ? '공용' : '')} {item.option_amount}{item.option_unit !== 'NONE_UNIT' ? displayUnit(item.option_unit) + ' ' : ''}수량 {item.quantity}개
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </>
            )}
          </View>

          <View style={styles.discountContainer}>
            <Text style={styles.discountTitle}>할인</Text>
            <View style={[layoutStyle.rowBetween, commonStyle.mt20, {alignItems: 'flex-start'}]}>
              <Text style={[styles.discountText, {marginTop: scale(20)}]}>쿠폰</Text>
              <View style={[styles.selectContainer, {flex: 1, marginLeft: scale(30)}]}>
                <TouchableOpacity
                  style={[styles.requestContainer, {paddingHorizontal: scale(12)}]}
                  onPress={() => setIsOpenCoupon(!isOpenCoupon)}
                >
                  <Text numberOfLines={1} style={[styles.requestText, {marginRight: scale(10)}]}>
                    {selectedCoupon ? `${selectedCoupon.discount_amount}${selectedCoupon.discount_type === 'PERCENT' ? '%' : '원'} 할인 ${selectedCoupon.description}` : '쿠폰을 선택해주세요'}
                  </Text>
                  <Image source={isOpenCoupon ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} style={{width: scale(14), height: scale(14), resizeMode: 'contain'}} />
                </TouchableOpacity>
                
                {isOpenCoupon && (
                  <View style={[styles.dropdownContainer]}>
                    <TouchableOpacity
                      style={[
                        layoutStyle.rowStart, 
                        { 
                          padding: scale(10),
                          width: '100%',
                        }
                      ]}
                      onPress={() => {
                        setSelectedCoupon(null);
                        setIsOpenCoupon(false);
                      }}
                    >
                      <Text style={[styles.requestText]}>선택안함</Text>
                    </TouchableOpacity>
                    {couponList.map((item, index) => {
                      const totalAmount = getTotalAmount();
                      const minOrderAmount = item.min_order_amount || 0;
                      const isUsableByAmount = totalAmount >= minOrderAmount;
                      const targetProductId = Number(item?.product_app_id || 0);
                      const hasTargetProduct = targetProductId === 0 || (selectedItems || []).some((si: any) => Number(si?.product_app_id) === targetProductId);
                      const isUsable = isUsableByAmount && hasTargetProduct;
                      
                      return (
                        <TouchableOpacity 
                          key={index}
                          style={[
                          layoutStyle.rowStart, 
                          { 
                            padding: scale(10),
                            borderTopWidth: 1,
                            borderTopColor: '#848484',
                            width: '100%',
                            opacity: isUsable ? 1 : 0.5,
                          }
                        ]}
                        onPress={() => {
                          if (isUsable) {
                            setSelectedCoupon(item);
                            setIsOpenCoupon(false);
                          }
                        }}
                        disabled={!isUsable}
                        >
                          <View style={[layoutStyle.rowStart]}>
                            <Text numberOfLines={1} style={[styles.requestText]}>
                              {item.discount_amount}{item.discount_type === 'PERCENT' ? '%' : '원'} 할인 {item.description}
                            </Text>
                            {!isUsableByAmount && (
                              <Text style={[styles.requestText, commonStyle.ml5, {color: '#FF0000', fontSize: scale(10), fontFamily: 'Pretendard-Regular', marginTop: scale(2)}]}>
                                {minOrderAmount.toLocaleString()}원 이상 사용 가능
                              </Text>
                            )}
                            {isUsableByAmount && !hasTargetProduct && (
                              <Text style={[styles.requestText, commonStyle.ml5, {color: '#FF0000', fontSize: scale(10), fontFamily: 'Pretendard-Regular', marginTop: scale(2)}]}>
                                해당 상품에 적용 불가
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
            <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
              <Text style={[styles.discountText]}>포인트</Text>
              <TextInput
                style={styles.pointInput}
                placeholder="0"
                placeholderTextColor="#202020"
                keyboardType="numeric"
                value={pointInput}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  
                  if (numericText === '') {
                    setPointInput('');
                    return;
                  }
                  
                  const inputValue = parseInt(numericText);
                  const maxPoint = Number(memberInfo?.total_point?.toString().replace(/,/g, '')) || 0;
                  
                  if (inputValue <= maxPoint) {
                    setPointInput(numericText);
                  }
                }}
              />
              <TouchableOpacity style={styles.totalPointBtn} onPress={() => {
                const totalPoint = memberInfo?.total_point || 0;
                setPointInput(totalPoint.toString().replace(/,/g, ''));
              }}>
                <Text style={styles.totalPointText}>전액사용</Text>
              </TouchableOpacity>
            </View>
            <View style={[layoutStyle.rowBetween, commonStyle.mt5]}>
              <View style={{width: '25%'}} />
              <Text style={styles.havePointText}>보유 : {memberInfo?.total_point ? memberInfo?.total_point : 0}P</Text>
              <View style={{width: '25%'}} />
            </View>
          </View>
          
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentTitle}>예상 결제금액</Text>
            <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
              <Text style={styles.amountLabel}>총 상품금액</Text>
              <Text style={styles.deliveryFee}>{getTotalAmount().toLocaleString()} 원</Text>
            </View>
            <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
              <Text style={styles.amountLabel}>상품 할인
                <Text style={{fontSize: scale(10), color: '#F04D4D', fontFamily: 'Pretendard-Regular'}}> 선할인</Text>
              </Text>
              <Text style={styles.deliveryFee}>{getTotalPriceSum().toLocaleString()} 원</Text>
            </View>
            {selectedCoupon && (
              <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
                <Text style={styles.amountLabel}>쿠폰 할인</Text>
                <Text style={styles.deliveryFee}>{getCouponDiscountAmount() > 0 ? `-${getCouponDiscountAmount().toLocaleString()} 원` : '0 원'}</Text>
              </View>
            )}
            {(() => {
              const v = parseInt(String(pointInput || '0').replace(/[^0-9]/g, ''), 10) || 0;
              if (v <= 0) return null;
              return (
                <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
                  <Text style={styles.amountLabel}>포인트 할인</Text>
                  <Text style={styles.deliveryFee}>-{v.toLocaleString()} 원</Text>
                </View>
              );
            })()}
            {selectedAddress?.zip_code && isCJRemoteArea(selectedAddress.zip_code) && getMaxRemoteDeliveryFee() > 0 && (
              <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
                <Text style={styles.amountLabel}>도서산간 배송비</Text>
                <Text style={styles.deliveryFee}>{getMaxRemoteDeliveryFee().toLocaleString()} 원</Text>
              </View>
            )}
            <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
              <Text style={styles.amountLabel}>배송비</Text>
              <Text style={styles.deliveryFee}>
                {(() => {
                  const pointVal = parseInt(String(pointInput || '0').replace(/[^0-9]/g, ''), 10) || 0;
                  const couponVal = getCouponDiscountAmount();
                  const base = Math.max(0, getTotalPriceSum() - pointVal - couponVal);
                  const threshold = getMaxFreeShippingThreshold();
                  if (threshold > 0 && base >= threshold) {
                    return '무료배송';
                  }
                  const fee = getMaxDeliveryFee();
                  return fee > 0 ? `${fee.toLocaleString()} 원` : '무료배송';
                })()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
              <Text style={styles.amountLabel}>총 {selectedItems.length}개 주문금액</Text>
              <Text style={styles.amountValue}>{getFinalPaymentAmount().toLocaleString()}원</Text>
            </View>
          </View>

          <View style={styles.agreeContainer}>
            <TouchableOpacity
              style={[layoutStyle.rowStart]}
              onPress={() => {
              toggleCheckbox(isAgreedToOrder, setIsAgreedToOrder);
              // 주문 동의 시 필수 3개 항목도 함께 토글
              const newState = !isAgreedToOrder;
              setIsAgreedToPrivacy(newState);
              setIsAgreedToThirdParty(newState);
              setIsAgreedToPayment(newState);
              setIsAgreedToEntrancePw(newState);
            }}>
              <Image source={isAgreedToOrder ? IMAGES.icons.checkboxGreen : IMAGES.icons.checkboxGray} style={styles.checkIcon} />
              <Text style={[styles.agreeBtnText]}>주문내용 확인 및 결제 동의</Text>
            </TouchableOpacity>

            <View style={[layoutStyle.rowStart, commonStyle.mt15]}>
                <TouchableOpacity onPress={() => toggleCheckbox(isAgreedToPrivacy, setIsAgreedToPrivacy)}>
                  <Image source={isAgreedToPrivacy ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} style={styles.checkIcon} />
                </TouchableOpacity>
            <TouchableOpacity
              style={[layoutStyle.rowBetween, {flex: 1}]}
              onPress={() => setPrivacyModalVisible(true)}>
              <Text style={styles.agreeBtnText}>(필수) 개인정보 수집 · 이용 동의</Text>
              <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
            </TouchableOpacity>
          </View>
          <View style={[layoutStyle.rowStart, commonStyle.mt15]}>
              <TouchableOpacity onPress={() => toggleCheckbox(isAgreedToThirdParty, setIsAgreedToThirdParty)}>
                <Image source={isAgreedToThirdParty ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} style={styles.checkIcon} />
              </TouchableOpacity>
            <TouchableOpacity
              style={[layoutStyle.rowBetween, {flex: 1}]}
              onPress={() => setThirdPartyModalVisible(true)}>
              <Text style={styles.agreeBtnText}>(필수) 개인정보 제 3자 정보 제공 동의</Text>
              <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
            </TouchableOpacity>
          </View>
          <View style={[layoutStyle.rowStart, commonStyle.mt15]}>
              <TouchableOpacity onPress={() => toggleCheckbox(isAgreedToPayment, setIsAgreedToPayment)}>
                <Image source={isAgreedToPayment ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} style={styles.checkIcon} />
              </TouchableOpacity>
            <TouchableOpacity
              style={[layoutStyle.rowBetween, {flex: 1}]}
              onPress={() => setPaymentTermsModalVisible(true)}>
              <Text style={styles.agreeBtnText}>(필수) 결제대행 서비스 이용약관 동의</Text>
              <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
            </TouchableOpacity>
          </View>
          <View style={[layoutStyle.rowStart, commonStyle.mt15]}>
              <TouchableOpacity onPress={() => toggleCheckbox(isAgreedToEntrancePw, setIsAgreedToEntrancePw)}>
                <Image source={isAgreedToEntrancePw ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} style={styles.checkIcon} />
              </TouchableOpacity>
            <TouchableOpacity
              style={[layoutStyle.rowBetween, {flex: 1}]}
              onPress={() => setEntrancePwModalVisible(true)}>
              <Text style={styles.agreeBtnText}>(필수) 공동현관비밀번호 개인정보 수집ㆍ이용 동의</Text>
              <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[
            styles.paymentButton,
            (!isAgreedToOrder || !isAgreedToPrivacy || !isAgreedToThirdParty || !isAgreedToPayment) && { backgroundColor: '#D9D9D9' }
          ]}
          disabled={!isAgreedToOrder || !isAgreedToPrivacy || !isAgreedToThirdParty || !isAgreedToPayment}
          onPress={handlePayment}
        >
          <Text style={styles.paymentButtonText}>결제하기</Text>
        </TouchableOpacity>
      </View>

      </View>

      {/* 개별 약관 모달 */}
      <CommonModal
        visible={privacyModalVisible}
        title="(필수) 개인정보 수집 · 이용 동의"
        content=""
        onClose={() => setPrivacyModalVisible(false)}
        background="#FFFFFF"
        textColor="#202020"
      >
        {paymentPrivacyText.map((row, rowIdx) => (
            <View key={`row_${rowIdx}`} style={[styles.tableRow, {flexDirection: 'row'}]}>
              {row.map((cell, cellIdx) => {
                const isEmpty = String(cell || '').trim().length === 0;
                return (
                  <View
                    key={`cell_${rowIdx}_${cellIdx}`}
                    style={[
                      styles.tableCell,
                      {
                        borderLeftWidth: 1,
                        // keep top border on header row; otherwise hide for empty cells
                        borderTopWidth: rowIdx === 0 ? 1 : (isEmpty ? 0 : 1),
                        borderRightWidth: cellIdx === row.length - 1 ? 1 : 0,
                        borderBottomWidth: rowIdx === paymentPrivacyText.length - 1 ? 1 : 0,
                        borderColor: '#DDDDDD',
                      },
                    ]}
                  >
                    <Text style={styles.modalText}>{cell}</Text>
                  </View>
                );
              })}
            </View>
          ))}
          <Text style={[styles.modalText, {marginTop: scale(10), textAlign: 'left'}]}>이용자는 개인정보 수집 및 이용에 동의하지 않을 권리가 있습니다.{'\n'}
          단, 동의를 거부하실 경우 상품 구매 서비스 이용이 제한될 수 있습니다.</Text>
      </CommonModal>
      
      <CommonModal
        visible={thirdPartyModalVisible}
        title="(필수) 개인정보 제 3자 정보 제공 동의"
        content=""
        onClose={() => setThirdPartyModalVisible(false)}
        background="#FFFFFF"
        textColor="#202020"
      >
        <View>
          <Text>• 서비스 제공을 위해 아래의 정보가 제3자에게 제공됩니다.</Text>
          <Text>• 이용자는 개인정보 제공에 동의하지 않을 수 있으나, 동의하지 않을 경우 일부 서비스 이용이 제한될 수 있습니다.</Text>
        </View>

        {(() => {
          const brandList = Array.from(new Set((selectedItems || []).map((it: any) => String(it?.brand_name || '').trim()).filter(Boolean))).join(', ') || '-';
          const thirdPartyInfoRows: string[][] = [
            ['개인정보를 제공받는 자', brandList],
            ['개인정보 이용 목적', '상품 배송, 반품 및 환불 처리, 고객 문의 및 불만 대응, A/S 및 혜택 제공, 상품 및 판매 관리 등'],
            ['제공 항목', '수취인 이름, 주소, 우편번호, 휴대전화번호, 배송메모, ID'],
            ['보유 및 이용기간', '서비스 제공 기간 동안 보유하며, 관계 법령에 따라 보존 필요 시 또는 이용자 동의 시 해당 기간까지 보관'],
          ];
          return (
            <View style={[commonStyle.mt15]}>
              {thirdPartyInfoRows.map((row, rIdx) => (
                <View key={`tp_row_${rIdx}`} style={[styles.tableRow, {flexDirection: 'row'}]}>
                  {row.map((cell, cIdx) => (
                    <View
                      key={`tp_cell_${rIdx}_${cIdx}`}
                      style={[
                        styles.tableCell,
                        {
                          flex: cIdx === 0 ? 3 : 7,
                          borderLeftWidth: 1,
                          borderTopWidth: 1,
                          borderRightWidth: cIdx === row.length - 1 ? 1 : 0,
                          borderBottomWidth: rIdx === thirdPartyInfoRows.length - 1 ? 1 : 0,
                          borderColor: '#DDDDDD',
                        },
                      ]}
                    >
                      <Text style={[styles.modalText, {textAlign: cIdx === 0 ? 'center' : 'left'}]}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })()}
      </CommonModal>

      <CommonModal
        visible={paymentTermsModalVisible}
        title="(필수) 결제대행 서비스 이용약관 동의"
        content=""
        onClose={() => setPaymentTermsModalVisible(false)}
        background="#FFFFFF"
        textColor="#202020"
      >
        <Text style={{fontFamily: 'Pretendard-SemiBold', marginTop: scale(15)}}>
          1. 전자금융거래 이용약관
        </Text>
        <Text>{thirdPrivacyTextFirst}</Text>
        <Text style={{fontFamily: 'Pretendard-SemiBold', marginTop: scale(15)}}>
          2. 개인정보 수집 및 이용 동의
        </Text>
        <Text style={{fontSize: scale(10), marginVertical: scale(10), fontFamily: 'Pretendard-Regular'}}>
          * 개인정보 수집 및 이용에 관한 동의 사항은{'\n'}
          개인정보의 수집·이용 목적, 수집 항목 및 방법, 그리고 보유 및 이용 기간을 각각 구분하여 명확히 안내합니다.
        </Text>
        {thirdPrivacyTextSecond.map((row, rowIdx) => (
          <View key={`row_${rowIdx}`} style={[styles.tableRow, {flexDirection: 'row'}]}>
            {row.map((cell, cellIdx) => {
              const isEmpty = String(cell || '').trim().length === 0;
              return (
                <View
                  key={`cell_${rowIdx}_${cellIdx}`}
                  style={[
                    styles.tableCell,
                    {
                      borderLeftWidth: 1,
                      // keep top border on header row; otherwise hide for empty cells
                      borderTopWidth: rowIdx === 0 ? 1 : (isEmpty ? 0 : 1),
                      borderRightWidth: cellIdx === row.length - 1 ? 1 : 0,
                      borderBottomWidth: rowIdx === thirdPrivacyTextSecond.length - 1 ? 1 : 0,
                      borderColor: '#DDDDDD',
                    },
                  ]}
                >
                    <Text style={[styles.modalText, {fontFamily: 'Pretendard-Regular'}]}>{cell}</Text>
                </View>
              );
            })}
          </View>
        ))}
        <Text style={[styles.modalText, {marginTop: scale(10), textAlign: 'left'}]}>이용자는 회사의 개인정보 수집 및 이용에 대한 동의를 거부할 수 있습니다.{'\n'}다만, 동의하지 않을 경우 결제 및 서비스 이용이 정상적으로 진행되지 않을 수 있습니다.</Text>
        <Text style={{fontFamily: 'Pretendard-SemiBold', marginTop: scale(15)}}>
          3. 개인정보 제3자 제공 동의
        </Text>
        <Text style={[styles.modalText, commonStyle.mt10, {textAlign: 'left'}]}>
          1. 회사는 이용자의 개인정보를 본 개인정보처리방침에서 고지한 범위 내에서 사용하며, 이용자의 사전 동의 없이 본래의 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다. 다만, 관련 법령에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관 등에 개인정보를 제공하여야 하는 경우는 예외로 합니다. 회사의 서비스 이행을 위하여 개인정보를 제3자에게 제공하고 있는 경우는 다음과 같습니다.
        </Text>
        <View style={[commonStyle.mt15]}>
          {thirdPrivacyTextThird.map((row, rowIdx) => (
            <View key={`row_${rowIdx}`} style={[styles.tableRow, {flexDirection: 'row'}]}>
              {row.map((cell, cellIdx) => {
                const isEmpty = String(cell || '').trim().length === 0;
                return (
                  <View
                    key={`cell_${rowIdx}_${cellIdx}`}
                    style={[
                      styles.tableCell,
                      {
                        borderLeftWidth: 1,
                        // keep top border on header row; otherwise hide for empty cells
                        borderTopWidth: rowIdx === 0 ? 1 : (isEmpty ? 0 : 1),
                        borderRightWidth: cellIdx === row.length - 1 ? 1 : 0,
                        borderBottomWidth: rowIdx === totalRows - 1 ? 1 : 0,
                        borderColor: '#DDDDDD',
                      },
                    ]}
                  >
                    <Text style={styles.modalText}>{cell}</Text>
                  </View>
                );
              })}
            </View>
          ))}
          <Text style={[styles.modalText, {marginTop: scale(10), textAlign: 'left'}]}>2. 개인정보 처리 위탁을 하는 업무의 내용 및 수탁자{('\n')}회사는 정보주체의 개인정보가 안전하게 처리될 수 있도록 개인정보처리 수탁자를 관리,감독하고 홈페이지에 공개하고 있습니다.</Text>
          <View style={[commonStyle.mt15]}>
            {entrustRows.map((row, rIdx) => (
              <View key={`entrust_row_${rIdx}`} style={[styles.tableRow, {flexDirection: 'row'}]}>
                {row.map((cell, cIdx) => (
                  <View
                    key={`entrust_cell_${rIdx}_${cIdx}`}
                    style={[
                      styles.tableCell,
                      {
                        borderLeftWidth: 1,
                        borderTopWidth: 1,
                        borderRightWidth: cIdx === row.length - 1 ? 1 : 0,
                        borderBottomWidth: rIdx === entrustRows.length - 1 ? 1 : 0,
                        borderColor: '#DDDDDD',
                      },
                    ]}
                  >
                    <Text style={styles.modalText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
        <Text style={[styles.modalText, {marginTop: scale(10), textAlign: 'left'}]}>3. 이용자는 회사의 개인정보 수집 및 이용에 대한 동의를 거부할 수 있습니다.{'\n'}다만, 동의하지 않을 경우 결제 및 서비스 이용이 정상적으로 진행되지 않을 수 있습니다.</Text>
      </CommonModal>

      <CommonModal
        visible={entrancePwModalVisible}
        title="(필수) 공동현관비밀번호 개인정보 수집ㆍ이용 동의"
        content=""
        onClose={() => setEntrancePwModalVisible(false)}
        background="#FFFFFF"
        textColor="#202020"
      >
        <View>
          <Text style={[styles.modalText, {textAlign: 'left'}]}>• 이용자는 개인정보 제공에 동의하지 않을 권리가 있으며, 다만 동의하지 않을 경우 서비스 이용이 제한될 수 있습니다.</Text>
          <Text style={[styles.modalText, {textAlign: 'left', marginTop: scale(6)}]}>• 공동현관 비밀번호는 당일 배송을 위한 목적에 한해 배송처리사에게만 제공되며, 상품 판매사에는 공유되지 않습니다.</Text>
        </View>

        {(() => {
          const rows: string[][] = [
            ['개인정보 이용목적', '새벽/직진 상품 배송'],
            ['수집 항목', '공동현관 비밀번호'],
            ['보유 및 이용 기간', '회원탈퇴 시 파기처리'],
          ];
          return (
            <View style={[commonStyle.mt15]}>
              {rows.map((row, rIdx) => (
                <View key={`entrance_pw_row_${rIdx}`} style={[styles.tableRow, {flexDirection: 'row'}]}>
                  {row.map((cell, cIdx) => (
                    <View
                      key={`entrance_pw_cell_${rIdx}_${cIdx}`}
                      style={[
                        styles.tableCell,
                        {
                          borderLeftWidth: 1,
                          borderTopWidth: 1,
                          borderRightWidth: cIdx === row.length - 1 ? 1 : 0,
                          borderBottomWidth: rIdx === rows.length - 1 ? 1 : 0,
                          borderColor: '#DDDDDD',
                        },
                      ]}
                    >
                      <Text style={[styles.modalText, {textAlign: cIdx === 0 ? 'center' : 'left'}]}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })()}
      </CommonModal>
      <CommonPopup
        visible={popup.visible}
        message={popup.message}
        backgroundColor="#FFFFFF"
        textColor="#202020"
        type={popup.type}
        onConfirm={() => {
          if (popup.onConfirm) {
            popup.onConfirm();
          }
        }}
        onCancel={popup.type === 'confirm' ? popup.onCancel : undefined}
        confirmText="확인"
        cancelText="취소"
      />
      <CommonPopup
        visible={successPopupVisible}
        message="결제가 완료되었습니다"
        backgroundColor="#FFFFFF"
        textColor="#202020"
        onConfirm={() => {
          setSuccessPopupVisible(false);
          try {
            navigation.navigate('ShoppingOrderHistory' as never);
          } catch {}
        }}
        confirmText="확인"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  addressContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  addressTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
  },
  addressChangeBtn: {
    borderWidth: 1,
    borderColor: '#5588FF',
    borderRadius: scale(5),
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
  },
  addressChangeBtnText: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#5588FF'
  },
  addressName: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020'
  },
  editText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#5588FF'
  },
  receiverInfo: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#848484',
    marginTop: scale(10)
  },
  addressText: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
    marginTop: scale(10)
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(10),
  },
  requestText: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
  },
  addressAddBtn: {
    borderWidth: 1,
    borderColor: '#5588FF',
    borderRadius: scale(10),
    padding: scale(10),
    alignItems: 'center',
    marginVertical: scale(5),
    marginTop: scale(15),
  },
  addressBtnText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#5588FF'
  },
  orderContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  orderTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
  },
  arrowDown: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain'
  },
  itemContainer: {
    marginTop: scale(15),
    backgroundColor: '#F6F6F6',
    padding: scale(16),
    borderRadius: scale(10)
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  thumbnail: {
    borderRadius: scale(4)
  },
  itemInfo: {
    marginLeft: scale(10),
    flex: 1
  },
  brandName: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    color: '#848484'
  },
  productTitle: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
    marginVertical: scale(4)
  },
  priceText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020'
  },
  optionContainer: {
    backgroundColor: '#EEEEEE',
    padding: scale(14),
    borderRadius: scale(10),
    marginTop: scale(10)
  },
  optionText: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#848484',
  },
  discountContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  discountTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
  },
  discountText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
  },
  couponBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    overflow: 'hidden',
    padding: scale(10),
    marginLeft: scale(30)
  },
  pointInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    padding: scale(10),
    marginLeft: scale(20),
    textAlign: 'right',
  },
  havePointText: {
    width: '50%',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#848484',
    textAlign: 'right',
  },
  totalPointBtn: {
    borderWidth: 1,
    borderColor: '#5588FF',
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    marginLeft: scale(10),
  },
  totalPointText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#5588FF',
  },
  paymentContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  paymentTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
  },
  amountLabel: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
    color: '#848484'
  },
  amountValue: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Medium',
    color: '#F04D4D'
  },
  deliveryFee: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Medium',
    color: '#202020'
  },
  summaryDivider: {
    height: scale(1),
    backgroundColor: '#EEEEEE',
    marginTop: scale(20),
    marginHorizontal: -scale(16),
  },
  agreeContainer: {
    padding: scale(16),
  },
  checkIcon: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
  },
  agreeBtnText: {
    fontSize: scale(12),
    color: '#202020',
    marginLeft: scale(10),
    fontFamily: 'Pretendard-Regular'
  },
  buttonContainer: {
    padding: scale(16),
  },
  paymentButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(10),
    padding: scale(16),
    alignItems: 'center'
  },
  paymentButtonText: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF'
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    marginTop: scale(10)
  },
  dropdownContainer: {
    borderTopWidth: 1,
    borderTopColor: '#848484',
    borderBottomLeftRadius: scale(10),
    borderBottomRightRadius: scale(10),
    overflow: 'hidden'
  },
  tableRow: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    width: '100%',
  },
  tableCell: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: scale(4),
    paddingVertical: scale(8),
  },
  borderCell: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  modalText: {
    fontSize: scale(12),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
});

export default ShoppingPayment; 