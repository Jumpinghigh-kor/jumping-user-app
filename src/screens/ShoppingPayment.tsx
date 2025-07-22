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
import { getMemberCouponAppList } from '../api/services/memberCouponApp';
import CommonPopup from '../components/CommonPopup';
import { usePopup } from '../hooks/usePopup';
import { toggleCheckbox } from '../utils/commonFunction';
import Portone from '../components/Portone';
import { verifyPayment } from '../api/services/portoneService';
import { isCJRemoteArea, CJ_REMOTE_AREA_SHIPPING_FEE } from '../constants/postCodeData';

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
  const [pointInput, setPointInput] = useState('');
  const [couponList, setCouponList] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isOpenCoupon, setIsOpenCoupon] = useState(false);
  
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
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // 최종 결제 금액 계산 (쿠폰, 포인트 할인 적용)
  const getFinalPaymentAmount = () => {
    let totalAmount = getTotalAmount(); // 상품금액
    
    // 쿠폰 할인 적용 (상품금액에만)
    if (selectedCoupon) {
      if (selectedCoupon.discount_type === 'PERCENT') {
        totalAmount = totalAmount - (totalAmount * selectedCoupon.discount_amount / 100);
      } else {
        totalAmount = totalAmount - selectedCoupon.discount_amount;
      }
    }
    
    // 배송비 추가 (10만원 이상 무료배송)
    const shippingFee = getTotalAmount() >= parseInt(selectedItems[0]?.free_shipping_amount?.toString().replace(/,/g, '') || '0') ? 0 : parseInt(selectedItems[0]?.delivery_fee?.toString().replace(/,/g, '') || '0');
    totalAmount = totalAmount + shippingFee;
    
    // 포인트 할인 적용
    if (pointInput) {
      totalAmount = totalAmount - parseInt(pointInput);
    }

    if (selectedAddress?.zip_code && isCJRemoteArea(selectedAddress.zip_code)) {
      totalAmount = totalAmount + parseInt(selectedItems[0]?.remote_delivery_fee?.toString().replace(/,/g, '') || '0');
    }
    
    return Math.max(0, totalAmount); // 음수 방지
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
    merchantOrderId: `jid_${Date.now()}`,
    customerName: memberInfo?.mem_name || '',
    customerEmail: memberInfo?.mem_email_id || '',
    customerPhone: memberInfo?.mem_phone || '',
    description: '점핑하이 쇼핑몰 상품 주문'
  };

  if (showPortone) {
    return (
      <Portone
        visible={showPortone}
        paymentData={paymentData}
        onPaymentSuccess={(result) => {
          
          // 서버에서 결제 검증
          verifyPayment({ imp_uid: result.imp_uid })
            .then((verificationResult) => {
              console.log('결제 검증 성공:', verificationResult);
              setShowPortone(false);
              showWarningPopup('결제가 완료되었습니다');
              // TODO: 주문 생성 API 호출
            })
            .catch((error) => {
              console.error('결제 검증 실패:', error);
              setShowPortone(false);
              showWarningPopup('결제 검증에 실패했습니다.\n고객센터에 문의해주세요');
            });
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
  console.log(selectedItems);
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
                          {item.product_name} {item.option_gender && (item.option_gender === 'W' ? '여성' : '남성')} {item.option_amount}{item.option_unit} 수량 {item.quantity}개
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
            <View style={[layoutStyle.rowBetween, commonStyle.mt20]}>
              <Text style={styles.discountText}>쿠폰</Text>
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
                      <Text style={[styles.requestText, {color: '#D9D9D9'}]}>선택안함</Text>
                    </TouchableOpacity>
                    {couponList.map((item, index) => {
                      const totalAmount = getTotalAmount();
                      const minOrderAmount = item.min_order_amount || 0;
                      const isUsable = totalAmount >= minOrderAmount;
                      
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
                          <View>
                            <Text numberOfLines={1} style={[styles.requestText]}>
                              {item.discount_amount}{item.discount_type === 'PERCENT' ? '%' : '원'} 할인 {item.description}
                            </Text>
                            {!isUsable && (
                              <Text style={[styles.requestText, {color: '#FF0000', fontSize: scale(10), marginTop: scale(2)}]}>
                                {minOrderAmount.toLocaleString()}원 이상 사용 가능
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
              <Text style={styles.discountText}>포인트</Text>
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
            <Text style={styles.paymentTitle}>결제 금액</Text>
            {!!selectedItems[0]?.discount && (
              <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
                <Text style={styles.amountLabel}>상품 할인</Text>
                <Text style={styles.deliveryFee}>{selectedItems[0]?.discount}%</Text>
              </View>
            )}
            {selectedCoupon && (
              <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
                <Text style={styles.amountLabel}>쿠폰 할인</Text>
                <Text style={styles.deliveryFee}>{selectedCoupon ? selectedCoupon.discount_amount : 0}{selectedCoupon?.discount_type === 'PERCENT' ? '%' : '원'}</Text>
              </View>
            )}
            {pointInput && (
              <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
                <Text style={styles.amountLabel}>포인트</Text>
                <Text style={styles.deliveryFee}>{parseInt(pointInput).toLocaleString()}P</Text>
              </View>
            )}
            <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
              <Text style={styles.amountLabel}>배송비</Text>
              <Text style={styles.deliveryFee}>{getTotalAmount() >= parseInt(selectedItems[0]?.free_shipping_amount?.toString().replace(/,/g, '') || '0') ? '무료' : `${selectedItems[0]?.delivery_fee}원`}</Text>
            </View>
            {selectedAddress?.zip_code && isCJRemoteArea(selectedAddress.zip_code) && (
              <View style={[layoutStyle.rowBetween, commonStyle.mt15]}>
                <Text style={styles.amountLabel}>도서산간 배송비</Text>
                <Text style={styles.deliveryFee}>{parseInt(selectedItems[0]?.remote_delivery_fee?.toString().replace(/,/g, '') || '0').toLocaleString()}원</Text>
              </View>
            )}
            <View style={[layoutStyle.rowBetween, commonStyle.mt20]}>
              <Text style={styles.amountLabel}>총 결제 금액</Text>
              <Text style={styles.amountValue}>{getFinalPaymentAmount().toLocaleString()}원</Text>
            </View>
          </View>

          <View style={styles.agreeContainer}>
            <View style={[layoutStyle.rowStart]}>
              <TouchableOpacity onPress={() => {
                toggleCheckbox(isAgreedToOrder, setIsAgreedToOrder);
                // 주문 동의 시 필수 3개 항목도 함께 토글
                const newState = !isAgreedToOrder;
                setIsAgreedToPrivacy(newState);
                setIsAgreedToThirdParty(newState);
                setIsAgreedToPayment(newState);
              }}>
                <Image source={isAgreedToOrder ? IMAGES.icons.checkboxGreen : IMAGES.icons.checkboxGray} style={styles.checkIcon} />
              </TouchableOpacity>
              <Text style={styles.agreeBtnText}>주문내용 확인 및 결제 동의</Text>
            </View>
            <View style={[layoutStyle.rowStart, commonStyle.mt15]}>
                <TouchableOpacity onPress={() => toggleCheckbox(isAgreedToPrivacy, setIsAgreedToPrivacy)}>
                  <Image source={isAgreedToPrivacy ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} style={styles.checkIcon} />
                </TouchableOpacity>
              <TouchableOpacity
                style={[layoutStyle.rowBetween, {flex: 1}]}>
                <Text style={styles.agreeBtnText}>(필수) 개인정보 수집 · 이용 동의</Text>
                <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
              </TouchableOpacity>
            </View>
            <View style={[layoutStyle.rowStart, commonStyle.mt15]}>
                <TouchableOpacity onPress={() => toggleCheckbox(isAgreedToThirdParty, setIsAgreedToThirdParty)}>
                  <Image source={isAgreedToThirdParty ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} style={styles.checkIcon} />
                </TouchableOpacity>
              <TouchableOpacity
                style={[layoutStyle.rowBetween, {flex: 1}]}>
                <Text style={styles.agreeBtnText}>(필수) 개인정보 제 3자 정보 제공 동의</Text>
                <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
              </TouchableOpacity>
            </View>
            <View style={[layoutStyle.rowStart, commonStyle.mt15]}>
                <TouchableOpacity onPress={() => toggleCheckbox(isAgreedToPayment, setIsAgreedToPayment)}>
                  <Image source={isAgreedToPayment ? IMAGES.icons.checkGreen : IMAGES.icons.checkGray} style={styles.checkIcon} />
                </TouchableOpacity>
              <TouchableOpacity
                style={[layoutStyle.rowBetween, {flex: 1}]}>
                <Text style={styles.agreeBtnText}>(필수) 결제대행 서비스 이용약관 동의</Text>
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
            <Text style={styles.paymentButtonText}>{getFinalPaymentAmount().toLocaleString()}원 결제하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CommonPopup
        visible={popup.visible}
        message={popup.message}
        backgroundColor="#FFFFFF"
        textColor="#202020"
        type={popup.type}
        onConfirm={popup.onConfirm}
        onCancel={popup.type === 'confirm' ? popup.onCancel : undefined}
        confirmText="확인"
        cancelText="취소"
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
    fontWeight: '600',
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
    color: '#5588FF'
  },
  addressName: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#202020'
  },
  editText: {
    fontSize: scale(14),
    color: '#5588FF'
  },
  receiverInfo: {
    fontSize: scale(12),
    color: '#848484',
    marginTop: scale(10)
  },
  addressText: {
    fontSize: scale(12),
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
    color: '#5588FF'
  },
  orderContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  orderTitle: {
    fontSize: scale(16),
    fontWeight: '600',
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
    fontWeight: '500',
    color: '#848484'
  },
  productTitle: {
    fontSize: scale(12),
    color: '#202020',
    marginVertical: scale(4)
  },
  priceText: {
    fontSize: scale(14),
    fontWeight: '600',
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
    color: '#848484',
  },
  discountContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  discountTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#202020',
  },
  discountText: {
    fontSize: scale(14),
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
    color: '#5588FF',
  },
  paymentContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  paymentTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#202020',
  },
  amountLabel: {
    fontSize: scale(14),
    color: '#848484'
  },
  amountValue: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#F04D4D'
  },
  deliveryFee: {
    fontSize: scale(16),
    color: '#202020'
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
    fontSize: scale(14),
    color: '#202020',
    marginLeft: scale(10)
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
    fontWeight: '600',
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
});

export default ShoppingPayment; 