import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  Platform,
  TextInput,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { getCommonCodeList, CommonCode } from '../api/services/commonCodeService';
import { scale } from '../utils/responsive';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { createModalPanResponder } from '../utils/commonFunction';
import ReturnImgPicker from '../components/ReturnImgPicker';
import { Asset } from 'react-native-image-picker';
import { getMemberReturnAppList, updateMemberReturnApp, updateMemberReturnAppCancelYn } from '../api/services/memberReturnAppService';
import { getTargetMemberShippingAddress, ShippingAddressItem, updateSelectYn } from '../api/services/memberShippingAddressService';
import { insertMemberReturnApp } from '../api/services/memberReturnAppService';
import { updateOrderStatus, insertMemberOrderDetailApp, updateOrderQuantity, getMemberOrderAppList } from '../api/services/memberOrderAppService';
import { insertMemberOrderAddress, deleteMemberOrderAddress, updateMemberOrderAddress, updateOrderDetailAppId } from '../api/services/memberOrderAddressService';
import { getReturnExchangePolicyList, ReturnExchangePolicy } from '../api/services/returnExchangePolicyService';
import CommonPopup from '../components/CommonPopup';
import CustomToast from '../components/CustomToast';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import { isCJRemoteArea, CJ_REMOTE_AREA_SHIPPING_FEE } from '../constants/postCodeData';
import CommonModal from '../components/CommonModal';

// 네비게이션 타입 정의
type RootStackParamList = {
  ShoppingAddress: {
    screen: string;
    shippingAddressId?: number;
  };
  ShoppingOrderHistory: {
    orderAppId: any;
  };
  ShoppingDetail: {
    productParams: any;
  };
  ShoppingShipping: {
    item: any;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ShoppingReturn = ({route}: any) => {
  const {item} = route.params;
  const navigation = useNavigation<NavigationProp>();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [activeTab, setActiveTab] = useState('request');
  const [selectedType, setSelectedType] = useState('return');
  const [selectedReason, setSelectedReason] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [returnReasons, setReturnReasons] = useState<CommonCode[]>([]);
  const [returnData, setReturnData] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [customReason, setCustomReason] = useState('');
  const [selectedCommonCode, setSelectedCommonCode] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityText, setQuantityText] = useState<string>('1');
  const maxQty = Number(route?.params?.maxQuantity ?? item?.order_quantity ?? 1);
  const [requestConfirmVisible, setRequestConfirmVisible] = useState(false);
  const [returnPolicies, setReturnPolicies] = useState<ReturnExchangePolicy[]>([]);
  const [originalTotalQty, setOriginalTotalQty] = useState<number | undefined>(undefined);

  // 뒤로가기 처리 함수
  const handleBackPress = async () => {
    // 선택된 배송지가 있으면 updateSelectYn 호출
    if (shippingAddress) {
      try {
        await updateSelectYn({
          mem_id: memberInfo?.mem_id,
          shipping_address_id: shippingAddress.shipping_address_id,
          select_yn: 'N'
        });
        
      } catch (error) {
        console.error('배송지 선택 해제 실패:', error);
      }
    } else {
    }
    navigation.goBack();
  };  
  
  // getTargetMemberShippingAddress API 통신
  const fetchShippingAddress = async () => {
    try {
      const response = await getTargetMemberShippingAddress({ mem_id: memberInfo?.mem_id });

      if (response.success) {
        setShippingAddress(response.data);
      }

    } catch (error) {
      console.error('배송지 정보 API 에러:', error);
    }
  };
  
  // getMemberReturnApp API 통신
  const fetchMemberReturnApp = async () => {
    try {
      const response = await getMemberReturnAppList({ mem_id: Number(memberInfo?.mem_id), order_detail_app_id: Number(item?.order_detail_app_id) });
      
      if (response.success) {
        setReturnData(response.data);
      }
    } catch (error) {
      console.error('반품/교환 API 에러:', error);
    }
  };
  
  // 반품 신청이 선택되었을 때 반품 사유 목록 가져오기
  useEffect(() => {
    const fetchReturnReasons = async () => {
      if (selectedType === 'return') {
        try {
          const response = await getCommonCodeList({ group_code: 'RETURN_REASON_TYPE' });
          if (response.success && response.data) {
            setReturnReasons(response.data.filter((item: any) => item.common_code !== 'QUANTITY_REASON'));
          }
        } catch (error) {
          console.error('반품 사유 API 에러:', error);
          setReturnReasons([]);
        }
      } else if (selectedType === 'exchange') {
        try {
          const exRes = await getCommonCodeList({ group_code: 'EXCHANGE_REASON_TYPE' });
          const list = (exRes?.success && Array.isArray(exRes.data) && exRes.data.length > 0)
            ? exRes.data
            : ((await getCommonCodeList({ group_code: 'RETURN_REASON_TYPE' }))?.data || []);
          setReturnReasons(Array.isArray(list) ? list.filter((it: any) => it?.common_code !== 'QUANTITY_REASON') : []);
        } catch (error) {
          setReturnReasons([]);
        }
      } else {
        setReturnReasons([]);
        setSelectedReason('');
      }
    };
    
    fetchReturnReasons();
    // 탭 전환 시 사유 드롭다운 닫기
    setShowReasonDropdown(false);
  }, [selectedType]);

  useFocusEffect(
    useCallback(() => {
      fetchMemberReturnApp();
      fetchShippingAddress();
      (async () => {
        try {
          const res = await getReturnExchangePolicyList({ product_app_id: String(item?.product_app_id ?? '') });
          if (res?.success && Array.isArray(res.data)) {
            const sorted = [...res.data].sort((a, b) => Number(a.order_seq ?? 0) - Number(b.order_seq ?? 0));
            setReturnPolicies(sorted);
          } else {
            setReturnPolicies([]);
          }
        } catch (e) {
          setReturnPolicies([]);
        }
      })();

      // 원래 총 수량 보정: 동일 결제/동일 상품 기준으로 합산
      (async () => {
        try {
          if (!memberInfo?.mem_id || !item) return;
          const res = await getMemberOrderAppList({ mem_id: Number(memberInfo?.mem_id), screen_type: 'ORDER_HISTORY' } as any);
          if (res?.success && Array.isArray(res.data)) {
            const related = res.data.filter((it: any) =>
              String(it?.payment_app_id) === String((item as any)?.payment_app_id) &&
              String(it?.product_detail_app_id) === String((item as any)?.product_detail_app_id)
            );
            const sum = related.reduce((acc: number, it: any) => acc + (Number(it?.order_quantity ?? 0) || 0), 0);
            if (sum > 0) setOriginalTotalQty(sum);
          }
        } catch (e) {}
      })();
      
      // 배송지 관리에서 돌아온 경우 선택된 배송지 정보 업데이트
      if (route.params?.selectedAddress) {
        setShippingAddress(route.params.selectedAddress);
        // params 초기화
        navigation.setParams({ selectedAddress: undefined });
      }
    }, [])
  );

  const showPopup = (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleReturnRequest = async () => {
    // 유효성 검사
    if (!selectedReason) {
      showPopup(`${selectedType === 'return' ? '반품' : '교환'} 사유를 선택해주세요.`, 'warning');
      return;
    }

    if (!shippingAddress) {
      showPopup('상품 회수지를 추가해주세요.');
      return;
    }

    // 교환 사유 상세 입력 필수
    if (selectedType === 'exchange') {
      const reasonText = (customReason || '').trim();
      if (!reasonText) {
        showPopup('교환 사유를 입력해주세요.', 'warning');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // 분할 처리: 신청 수량이 전체 수량보다 적으면 나머지 수량으로 새 주문상세 생성
      try {
        const originalQty = Number(item?.order_quantity ?? 0);
        const requestQty = Number(quantity ?? 0);
        const remainderQty = Math.max(0, originalQty - requestQty);
        if (requestQty > 0 && remainderQty > 0) {
          // 1) 남은 수량으로 새 주문상세 생성 (현재 주문 상태 유지)
          const newDetailRes = await insertMemberOrderDetailApp({
            order_detail_app_id: Number(item?.order_detail_app_id),
            order_app_id: Number(item?.order_app_id),
            product_detail_app_id: Number(item?.product_detail_app_id),
            order_status: String(item?.order_status || 'PAYMENT_COMPLETE'),
            order_quantity: remainderQty,
            order_group: 1,
            mem_id: Number(memberInfo?.mem_id),
            courier_code: String((item as any)?.company_courier_code || (item as any)?.customer_courier_code || (item as any)?.courier_code || ''),
            tracking_number: String((item as any)?.company_tracking_number || (item as any)?.customer_tracking_number || (item as any)?.tracking_number || ''),
            goodsflow_id: String((item as any)?.goodsflow_id || ''),
            purchase_confirm_dt: String((item as any)?.purchase_confirm_dt || ''),
          } as any);
          const newOrderDetailId = Number((newDetailRes as any)?.order_detail_app_id || 0);

          // 1-1) 기존 ORDER 주소를 신규 주문상세로 매핑
          try {
            const originalAddrId = Number((item as any)?.order_address_id);
            if (Number.isFinite(originalAddrId) && originalAddrId > 0 && Number.isFinite(newOrderDetailId) && newOrderDetailId > 0) {
              await updateOrderDetailAppId({
                order_address_id: originalAddrId,
                mem_id: Number(memberInfo?.mem_id),
                order_detail_app_id: newOrderDetailId,
              } as any);
            }
          } catch (e) {}

          // 2) 원 상세 수량을 신청 수량으로 업데이트 (반품/교환 대상)
          await updateOrderQuantity({
            order_detail_app_id: Number(item?.order_detail_app_id),
            mem_id: Number(memberInfo?.mem_id),
            order_quantity: requestQty,
          } as any);
        }
      } catch (e) {
        // 분할 실패 시에도 기존 흐름은 그대로 진행
      }

      // cancel_yn 기준 통합 분기 처리
      const isPreviouslyCancelled = Array.isArray(returnData)
        ? returnData.some((it: any) => it?.cancel_yn === 'Y')
        : (returnData && (returnData as any)?.cancel_yn === 'Y');

      let orderAddressIdToUse: number | undefined = undefined;
      
      if (isPreviouslyCancelled) {
        try {
          await deleteMemberOrderAddress({
            order_detail_app_id: Number(item?.order_detail_app_id),
            mem_id: Number(memberInfo?.mem_id),
          } as any);
        } catch (e) {}
      }

      const insertAddrRes = await insertMemberOrderAddress({
        order_detail_app_id: Number(item?.order_detail_app_id),
        mem_id: Number(memberInfo?.mem_id),
        order_address_type: 'RETURN',
        receiver_name: shippingAddress?.receiver_name || '',
        receiver_phone: (shippingAddress?.receiver_phone || '').replace(/-/g, ''),
        address: shippingAddress?.address || '',
        address_detail: shippingAddress?.address_detail || '',
        zip_code: shippingAddress?.zip_code || '',
        enter_way: shippingAddress?.enter_way,
        enter_memo: shippingAddress?.enter_memo,
        delivery_request: shippingAddress?.delivery_request,
      } as any);
      orderAddressIdToUse = Number((insertAddrRes && (insertAddrRes.data?.order_address_id ?? insertAddrRes.order_address_id)) || undefined);
    
      // 최신 반품/교환 데이터 확인 후 분기 (기록이 하나라도 있으면 업데이트 경로)
      let hasAnyReturnRecord = false;
      try {
        const latest = await getMemberReturnAppList({
          mem_id: Number(memberInfo?.mem_id),
          order_detail_app_id: Number(item?.order_detail_app_id),
        });
        hasAnyReturnRecord = !!(latest?.success && (Array.isArray(latest.data) ? latest.data.length > 0 : !!latest.data));
      } catch (e) {}

      let response;
      if (hasAnyReturnRecord) {
        // 취소 접수 해제: cancel_yn = 'N'
        await updateMemberReturnAppCancelYn({
          order_detail_app_ids: [Number(item?.order_detail_app_id)],
          mem_id: Number(memberInfo?.mem_id),
          cancel_yn: 'N',
        } as any);
        // 상세 정보 업데이트(사유/수량 등)
        response = await updateMemberReturnApp({
          order_detail_app_ids: [Number(item?.order_detail_app_id)],
          mem_id: Number(memberInfo?.mem_id),
          quantity: quantity,
          cancel_yn: 'N',
          return_reason_type: selectedCommonCode,
          reason: customReason,
        } as any);
      } else {
        response = await insertMemberReturnApp({
          order_detail_app_id: item.order_detail_app_id,
          order_address_id: Number(orderAddressIdToUse),
          mem_id: Number(memberInfo?.mem_id),
          return_reason_type: selectedCommonCode,
          reason: customReason,
          quantity: quantity
        });
      }

      if (response.success) {
        try {
          await updateOrderStatus({
            order_detail_app_ids: [Number(item?.order_detail_app_id)],
            mem_id: Number(memberInfo?.mem_id),
            order_status: (selectedType === 'exchange') ? 'EXCHANGE_APPLY' : 'RETURN_APPLY',
          } as any);
        } catch (e) {}

        // updateMemberOrderDetailApp 제거 (요청 사항)
        showToast(`${selectedType === 'return' ? '반품' : '교환'} 신청이 완료되었습니다.`, 'success');
        navigation.goBack();
      } else {
        showToast('신청 처리 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('반품/교환 신청 실패:', error.response.data.message);
      showToast('신청 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log('item', item);
  return (
    <>
      <CommonHeader 
        title="반품/교환 신청"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        onBackPress={handleBackPress}
      />
      <View style={styles.container}>
        {/* 탭 메뉴 */}
        <View style={[styles.tabContainer, {display: 'none'}]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'request' && styles.activeTab]}
            onPress={() => setActiveTab('request')}
          >
            <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText]}>
              반품/교환 신청
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              반품/교환 이력 {returnData ? returnData.length : 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 탭 내용 */}
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
        >
          <View style={styles.policyContainer}>
            <TouchableOpacity style={styles.policyContent} onPress={() => setShowPolicyModal(true)}>
              <Text style={styles.policyTitle}>반품/교환 정책 안내 및 반송 확인 방법</Text>
              <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(10), height: scale(10), resizeMode: 'contain'}} />
            </TouchableOpacity>
          </View>
          
            <View style={styles.tabContent}>
              {/* 체크박스 영역 */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkboxItem, commonStyle.mr20]}
                  onPress={() => {
                    if (selectedType !== 'return') {
                      setSelectedType('return');
                    }
                  }}
                >
                  <Image 
                    source={selectedType === 'return' ? IMAGES.icons.checkboxBlack : IMAGES.icons.checkboxGray} 
                    style={styles.checkboxImage}
                  />
                  <Text style={[styles.checkboxLabel, {color: selectedType === 'return' ? '#202020' : '#D9D9D9'}]}>반품 신청</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() => {
                    if (selectedType !== 'exchange') {
                      setSelectedType('exchange');
                      setSelectedCommonCode('');
                      setCustomReason('');
                    }
                  }}
                >
                  <Image 
                    source={selectedType === 'exchange' ? IMAGES.icons.checkboxBlack : IMAGES.icons.checkboxGray} 
                    style={styles.checkboxImage}
                  />
                  <Text style={[styles.checkboxLabel, {color: selectedType === 'exchange' ? '#202020' : '#D9D9D9'}]}>교환 신청</Text>
                </TouchableOpacity>
              </View>

              <View style={[commonStyle.mt15]}>
                <View style={[layoutStyle.rowStart, commonStyle.mb5]}>
                  <Image source={IMAGES.icons.infoBlack} style={{width: scale(13), height: scale(13), resizeMode: 'contain'}} />
                  <Text style={[styles.infoText, commonStyle.ml5]}>선결제 안내</Text>
                </View>
                <Text style={styles.infoText}>반품/교환 배송비는 신청 시 선결제 됩니다. 단, 상품 불량/오배송 등 판매자 귀책사유일 경우, 결제된 배송비는 환불 처리됩니다.</Text>
              </View>

              {selectedType === 'exchange' && (
                <View style={styles.exchangeProductContainer}>
                  <Text style={styles.exchangeProductTitle}>교환 상품</Text>
                  <TouchableOpacity 
                    style={[layoutStyle.rowAlignStart]}
                    onPress={() => navigation.navigate('ShoppingDetail' as never, { productParams: { product_app_id: item.product_app_id, product_detail_app_id: item.product_detail_app_id } } as never)}
                  >
                    <ShoppingThumbnailImg 
                      productAppId={item.product_app_id}
                      width={scale(70)} 
                      height={scale(70)}
                      style={styles.exchangeProductImage}
                    />
                    <View style={[commonStyle.ml10]}>
                      <Text style={styles.brandName}>{item?.brand_name}</Text>
                      <Text style={styles.productName}>{item?.product_name}</Text>
                      <View style={[layoutStyle.rowStart, {marginTop: scale(10)}]}>
                        <Text style={[styles.productPrice]}>{(() => {
                          const toNum = (v: any) => {
                            const n = Number(String(v ?? 0).replace(/[^0-9.-]/g, ''));
                            return isNaN(n) ? 0 : n;
                          };
                          const price = toNum((item as any)?.price);
                          const paymentAmount = toNum((item as any)?.payment_amount);
                          const totalPayment = toNum((item as any)?.total_payment_amount);
                          const qty = toNum(item?.order_quantity) || 1;
                          const derived = totalPayment > 0 && qty > 0 ? Math.round(totalPayment / qty) : 0;
                          const unit = price || paymentAmount || derived;
                          return unit.toLocaleString();
                        })()}원</Text>
                        <Text style={[styles.productPrice, commonStyle.ml5]}>/ {item?.option_unit} {item?.order_quantity}개</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.returnContainer}>
                <Text style={styles.returnTitle}>{selectedType === 'return' ? '반품' : '교환'} 사유</Text>
                {selectedType === 'return' ? (
                  <View style={styles.returnReasonContainer}>
                    <TouchableOpacity
                      style={styles.selectBox}
                      onPress={() => setShowReasonDropdown(!showReasonDropdown)}
                    >
                      <Text style={[styles.selectBoxText, !selectedReason && styles.placeholderText]}>
                        {selectedReason || `${selectedType === 'return' ? '반품' : '교환'} 사유를 선택해주세요`}
                      </Text>
                      <Image 
                        source={IMAGES.icons.arrowDownGray}
                        style={[styles.arrowIcon, showReasonDropdown && styles.arrowIconRotated]}
                      />
                    </TouchableOpacity>
                    
                    {showReasonDropdown && (
                      <View style={styles.dropdown}>
                        {returnReasons.map((reason, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dropdownItem,
                              selectedReason === reason.common_code_name && styles.selectedDropdownItem
                            ]}
                            onPress={() => {
                              setSelectedCommonCode(reason.common_code);
                              setSelectedReason(reason.common_code_name);
                              setShowReasonDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownText}>{reason.common_code_name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    <TextInput
                      style={styles.customReasonInput}
                      placeholder="사유를 입력해주세요(선택)"
                      placeholderTextColor="#848484"
                      value={customReason}
                      onChangeText={setCustomReason}
                      multiline={true}
                      numberOfLines={3}
                      maxLength={200}
                    />
                  </View>
                ) : (
                  <View style={commonStyle.mt15}>
                    <TouchableOpacity
                      style={styles.selectBox}
                      onPress={() => setShowReasonDropdown(!showReasonDropdown)}
                    >
                      <Text style={[styles.selectBoxText, !selectedReason && styles.placeholderText]}>
                        {selectedReason || '교환 사유를 선택해주세요'}
                      </Text>
                      <Image 
                        source={IMAGES.icons.arrowDownGray}
                        style={[styles.arrowIcon, showReasonDropdown && styles.arrowIconRotated]}
                      />
                    </TouchableOpacity>

                    {showReasonDropdown && (
                      <View style={styles.dropdown}>
                        {returnReasons.map((reason, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[styles.dropdownItem, selectedReason === reason.common_code_name && styles.selectedDropdownItem]}
                            onPress={() => {
                              setSelectedCommonCode((reason as any).common_code);
                              setSelectedReason(reason.common_code_name);
                              setShowReasonDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownText}>{reason.common_code_name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <TextInput
                      style={styles.customReasonInput}
                      placeholder={'교환 사유를 입력해주세요 (예: 사이즈 M→L, 색상 변경, 불량 위치, 구성품 누락)'}
                      placeholderTextColor="#848484"
                      value={customReason}
                      onChangeText={setCustomReason}
                      multiline={true}
                      numberOfLines={3}
                      maxLength={200}
                    />
                  </View>
                )}
              </View>

              {/* {selectedType === 'return' && (
                <View style={styles.uploadContainer}>
                  <Text style={styles.uploadTitle}>사진 업로드</Text>
                  <ReturnImgPicker 
                    onImagesSelected={setSelectedImages}
                    onFileIdsChange={setFileIds}
                    memberId={memberInfo?.mem_id}
                    hideTitle={true}
                    maxImages={3}
                  />
                  <Text style={styles.uploadDescription}>첨부파일은 최대 3장, 한 장당 최대 10MB까지 업로드 가능합니다</Text>
                </View>
              )} */}

              <View style={styles.shippingContainer}>
                <View style={styles.shippingTitleContainer}>
                  <Text style={styles.shippingTitle}>상품 회수지</Text>
                  <TouchableOpacity
                      onPress={() => {
                        // @ts-ignore
                        navigation.navigate('ShoppingAddress', {
                          screen: 'ShoppingReturn',
                          shippingAddressId: shippingAddress?.shipping_address_id
                        });
                      }}
                    >
                    <Text style={styles.shippingBtn}>배송지 {shippingAddress ? '변경' : '추가'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.shippingAddressContainer}>
                  <Text style={styles.shippingAddress}>
                    {shippingAddress ? `${shippingAddress.address} ${shippingAddress.address_detail}` : '배송지를 추가해주세요'}
                  </Text>
                </View>
              </View>

              <View style={styles.quantityContainer}>
                <Text style={styles.quantityTitle}>수량</Text>
                <View style={[styles.quantityControl, commonStyle.mt10]}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setQuantity(prev => {
                        const next = Math.max(1, prev - 1);
                        setQuantityText(String(next));
                        return next;
                      })
                    }
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="number-pad"
                    value={quantityText}
                    onChangeText={(text) => {
                       const digitsOnly = text.replace(/[^0-9]/g, '');
                      if (digitsOnly === '') {
                        setQuantityText('');
                        return;
                      }
                      setQuantityText(digitsOnly);
                      const parsed = parseInt(digitsOnly, 10);
                      if (!isNaN(parsed)) {
                        const clamped = Math.min(maxQty, Math.max(1, parsed));
                        setQuantity(clamped);
                      }
                    }}
                    onEndEditing={() => {
                      if (quantityText === '') {
                        setQuantity(1);
                        setQuantityText('1');
                      } else {
                        const parsed = parseInt(quantityText, 10);
                        const clamped = isNaN(parsed) ? 1 : Math.min(maxQty, Math.max(1, parsed));
                        setQuantity(clamped);
                        setQuantityText(String(clamped));
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setQuantity(prev => {
                        const next = Math.min(maxQty, prev + 1);
                        setQuantityText(String(next));
                        return next;
                      })
                    }
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.returnContainer}>
                <Text style={styles.returnTitle}>예상 {selectedType === 'return' ? '반품' : '교환'} 배송비</Text>
                <View style={[layoutStyle.rowBetween, {marginVertical: scale(10)}]}>
                  <Text style={styles.refundText}>배송비</Text>
                  <Text style={styles.refundText}>{(item?.return_delivery_fee * (selectedType === 'exchange' ? 2 : 1))?.toLocaleString()}원</Text>
                </View>
                {shippingAddress?.zip_code && isCJRemoteArea(shippingAddress.zip_code) && (
                  <View style={[layoutStyle.rowBetween, {marginBottom: scale(10)}]}>
                    <Text style={styles.refundText}>도서산간 배송비</Text>
                    <Text style={styles.refundText}>{Number(CJ_REMOTE_AREA_SHIPPING_FEE * (selectedType === 'return' ? 1 : 2)).toLocaleString()}원</Text>
                  </View>
                )}
              </View>

              {selectedType === 'return' && (
                <View style={styles.refundContainer}>
                  <View style={[commonStyle.mb5]}>
                    <Text style={styles.refundTitle}>예상 환불 금액</Text>
                  </View>
                    <>
                      <View style={[layoutStyle.rowBetween, {marginVertical: scale(5)}]}>
                        <Text style={styles.refundTotalTitle}>환불 금액</Text>
                        <Text style={styles.refundTotalAmount}>{(() => {
                          const toNum = (v: any) => {
                            const n = Number(String(v ?? 0).replace(/[^0-9.-]/g, ''));
                            return isNaN(n) ? 0 : n;
                          };
                          const totalPayment = toNum((item as any)?.total_payment_amount);
                          const originalQty = (originalTotalQty ?? toNum(item?.order_quantity));
                          const totalQty = Number((originalQty || 1));
                          const perUnit = totalQty > 0 ? totalPayment / totalQty : 0;
                          const qtyNum = Number(quantity ?? 1);
                          const qty = Number.isNaN(qtyNum) ? 1 : qtyNum;
                          const refund = Math.max(0, perUnit * qty);
                          return Math.round(refund).toLocaleString();
                        })()}원</Text>
                      </View>
                    </>
                </View>
              )}

              <View style={styles.requestContainer}>
                <TouchableOpacity 
                  style={[styles.requestBtn, isSubmitting && styles.disabledBtn]} 
                  onPress={() => setRequestConfirmVisible(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.requestBtnText}>{selectedType === 'return' ? '반품' : '교환'} 신청</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
      </View>

      <CommonPopup
        backgroundColor="#FFFFFF"
        textColor="#202020"
        visible={popupVisible}
        message={popupMessage}
        type={popupType === 'warning' ? 'warning' : 'default'}
        onConfirm={() => setPopupVisible(false)}
      />
      <CommonPopup
        backgroundColor="#FFFFFF"
        textColor="#202020"
        visible={requestConfirmVisible}
        message={`${selectedType === 'return' ? '반품' : '교환'}을 신청하시겠습니까?`}
        onConfirm={async () => {
          setRequestConfirmVisible(false);
          await handleReturnRequest();
        }}
        onCancel={() => setRequestConfirmVisible(false)}
        confirmText="확인"
        cancelText="취소"
      />
      
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <CommonModal
        visible={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="반품/교환 정책 안내"
        content="반품/교환 정책 내용이 여기에 표시됩니다."
        background="#FFFFFF"
        textColor="#202020"
      >
        {returnPolicies && returnPolicies.length > 0 ? (
          <View style={[commonStyle.mt15, commonStyle.mb20]}>
            {returnPolicies.map((ele, idx) => (
              <View key={idx}>
                <View style={ele?.direction === 'COLUMN' ? commonStyle.mb10 : styles.returnRowItem}>
                  <View style={ele?.direction === 'COLUMN' ? '' : styles.returnRowItemTitleCont}>
                    <Text style={ele?.direction === 'COLUMN' ? styles.returnColumnTitle : styles.returnRowItemTitle}>{ele.title}</Text>
                  </View>
                  <View style={ele?.direction === 'COLUMN' ? '' : styles.returnRowItemDescCont}>
                    <Text style={ele?.direction === 'COLUMN' ? styles.returnColumnDesc : styles.returnRowItemDesc}>{ele.content}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{color: '#202020', fontSize: scale(12), lineHeight: scale(18)}}>
            제품이 물류센터 도착 후, 다음날부터 영업일 기준 검수시간 1~3일 후 반품이 완료됩니다
          </Text>
        )}
      </CommonModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: scale(16),
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#848484',
  },
  tabButton: {
    flex: 1,
    paddingVertical: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#202020',
  },
  tabText: {
    fontSize: scale(16),
    color: '#848484',
  },
  activeTabText: {
    color: '#202020',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  policyContainer: {
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  policyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    padding: scale(10),
  },
  policyTitle: {
    fontSize: scale(12),
    color: '#848484',
  },
  policyText: {
    marginTop: scale(5),
    fontSize: scale(9.5),
    color: '#202020',
    fontWeight: '400',
  },
  placeholderText: {
    fontSize: scale(14),
    color: '#848484',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: scale(10),
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxImage: {
    width: scale(14),
    height: scale(14),
    resizeMode: 'contain',
  },
  checkboxLabel: {
    marginLeft: scale(5),
    fontSize: scale(14),
    color: '#D9D9D9',
  },
  infoText: {
    fontSize: scale(12),
    color: '#202020',
    fontWeight: '400',
  },
  quantityContainer: {
    marginTop: scale(20),
  },
  quantityTitle: {
    fontSize: scale(16),
    color: '#202020',
    fontWeight: '600',
  },
  returnContainer: {
    marginTop: scale(20),
  },
  returnTitle: {
    fontSize: scale(16),
    color: '#202020',
    fontWeight: '600',
  },
  returnReasonContainer: {
    marginTop: scale(15),
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(10),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
  },
  selectBoxText: {
    fontSize: scale(14),
    color: '#202020',
  },
  arrowIcon: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
  },
  arrowIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    marginTop: scale(10),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    paddingVertical: scale(10),
  },
  dropdownItem: {
    padding: scale(10),
  },
  dropdownText: {
    fontSize: scale(14),
    color: '#202020',
  },
  selectedDropdownItem: {
    backgroundColor: '#EEEEEE',
    marginHorizontal: scale(7),
    borderRadius: scale(10),
  },
  uploadContainer: {
    marginTop: scale(20),
  },
  uploadTitle: {
    fontSize: scale(16),
    color: '#202020',
    fontWeight: '600',
    marginBottom: scale(10),
  },
  uploadDescription: {
    fontSize: scale(10),
    color: '#717171',
    marginTop: scale(10),
  },
  shippingContainer: {
    marginTop: scale(20),
  },
  shippingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shippingTitle: {
    fontSize: scale(16),
    color: '#202020',
    fontWeight: '600',
  },
  shippingBtn: {
    fontSize: scale(12),
    color: '#4C78E0',
    fontWeight: '400',
  },
  shippingAddressContainer: {
    marginTop: scale(10),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    padding: scale(10),
  },
  shippingAddress: {
    fontSize: scale(12),
    color: '#848484',
    fontWeight: '400',
  },
  refundContainer: {
    marginTop: scale(15),
  },
  refundTitle: {
    fontSize: scale(16),
    color: '#202020',
    fontWeight: '600',
  },
  refundText: {
    fontSize: scale(12),
    color: '#848484',
    fontWeight: '400',
  },
  refundTotalTitle: {
    fontSize: scale(14),
    color: '#202020',
    fontWeight: '500',
  },
  refundTotalAmount: {
    fontSize: scale(14),
    color: '#F04D4D',
    fontWeight: '500',
  },
  requestContainer: {
    marginTop: scale(30),
    marginBottom: scale(20),
  },
  requestBtn: {
    backgroundColor: '#40B649',
    padding: scale(10),
    borderRadius: scale(10),
  },
  requestBtnText: {
    fontSize: scale(16),
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  customReasonInput: {
    marginTop: scale(10),
    padding: scale(10),
    paddingTop: scale(12),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    height: scale(100),
    textAlignVertical: 'top',
    textAlign: 'left',
    lineHeight: scale(18),
    
  },
  exchangeProductContainer: {
    marginTop: scale(20),
  },
  exchangeProductTitle: {
    fontSize: scale(16),
    color: '#202020',
    fontWeight: '600',
    marginBottom: scale(10),
  },
  exchangeProductImage: {
    borderRadius: scale(10),
  },
  brandName: {
    fontSize: scale(12),
    color: '#202020',
    fontWeight: '500',
  },
  productName: {
    fontSize: scale(12),
    color: '#202020',
    fontWeight: '400',
    marginTop: scale(3),
  },
  productPrice: {
    fontSize: scale(12),
    color: '#202020',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scale(80),
  },
  emptyIcon: {
    width: scale(50),
    height: scale(50),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(14),
    color: '#848484',
    marginTop: scale(10),
  },
  returnDataContainer: {
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    paddingHorizontal: scale(16),
    paddingVertical: scale(25),
  },
  returnStatus: {
    fontSize: scale(16),
    color: '#202020',
    fontWeight: '500',
  },
  returnDt: {
    fontSize: scale(14),
    color: '#202020',
    fontWeight: '400',
  },
  returnDetail: {
    fontSize: scale(12),
    color: '#202020',
    fontWeight: '400',
  },
  returnBtn: {
    width: '50%',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(5),
    padding: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    overflow: 'hidden',
    height: scale(36),
    width: scale(130),
  },
  qtyBtn: {
    width: scale(36),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: scale(18),
    color: '#202020',
    fontWeight: '500',
  },
  qtyInput: {
    flex: 1,
    height: '100%',
    textAlign: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'transparent',
    color: '#202020',
    fontSize: scale(14),
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  returnColumnTitle: {
    backgroundColor: '#EEEEEE',
    fontSize: scale(12),
    fontWeight: '500',
    color: '#202020',
    textAlign: 'center',
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  returnColumnDesc: {
    fontSize: scale(12),
    color: '#202020',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: scale(16),
    marginTop: scale(4),
  },
  returnRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '2%',
  },
  returnRowItemTitleCont: {
    backgroundColor: '#EEEEEE',
    width: '24%',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingVertical: scale(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnRowItemTitle: {
    fontSize: scale(12),
    fontWeight: '500',
    color: '#202020',
    textAlign: 'center',
  },
  returnRowItemDescCont: {
    width: '74%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
  },
  returnRowItemDesc: {
    fontSize: scale(12),
    color: '#202020',
  },
});

export default ShoppingReturn;
