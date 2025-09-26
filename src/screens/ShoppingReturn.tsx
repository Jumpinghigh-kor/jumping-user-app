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
import { getMemberReturnAppList } from '../api/services/memberReturnAppService';
import { getTargetMemberShippingAddress, ShippingAddressItem, updateSelectYn } from '../api/services/memberShippingAddressService';
import { insertMemberReturnApp } from '../api/services/memberReturnAppService';
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
  const [selectedImages, setSelectedImages] = useState<Asset[]>([]);
  const [fileIds, setFileIds] = useState<number[]>([]);
  const [returnData, setReturnData] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [customReason, setCustomReason] = useState('');
  const [selectedCommonCode, setSelectedCommonCode] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);

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
  
  // 반품 배송비 계산 함수
  const getShippingFee = () => {
    // 교환인 경우 항상 배송비 반환
    if (selectedType === 'exchange') {
      return parseInt(item?.delivery_fee?.toString().replace(/,/g, '') || '0') * 2;
    }
    
    // 반품인 경우 사유에 따라 배송비 결정
    if (!selectedReason) return 0;
    
    const selectedReasonData = returnReasons.find(reason => reason.common_code_name === selectedReason);
    if (selectedReasonData) {
      switch (selectedReasonData.common_code_memo) {
        case 'FREE_FEE':
          return 0;
        default:
          return parseInt(item?.delivery_fee?.toString().replace(/,/g, '') || '0');
      }
    }
    
    return 0;
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
      console.log('fetchMemberReturnApp');
      const response = await getMemberReturnAppList({ mem_id: Number(memberInfo?.mem_id) });
      console.log('response', response);
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
            setReturnReasons(response.data);
          }
        } catch (error) {
          console.error('반품 사유 API 에러:', error);
          setReturnReasons([]);
        }
      } else {
        setReturnReasons([]);
        setSelectedReason('');
      }
    };
    
    fetchReturnReasons();
  }, [selectedType]);

  useFocusEffect(
    useCallback(() => {
      fetchMemberReturnApp();
      fetchShippingAddress();
      
      // 배송지 관리에서 돌아온 경우 선택된 배송지 정보 업데이트
      if (route.params?.selectedAddress) {
        setShippingAddress(route.params.selectedAddress);
        // params 초기화
        navigation.setParams({ selectedAddress: undefined });
      }
    }, [])
  );

  const showPopup = (message: string) => {
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
      showPopup(`${selectedType === 'return' ? '반품' : '교환'} 사유를 선택해주세요.`);
      return;
    }

    if (!shippingAddress) {
      showPopup('상품 회수지를 추가해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      let uploadedFileNames: string[] = [];
      
      if (selectedImages.length > 0) {
        uploadedFileNames = selectedImages.map(img => img.fileName).filter(Boolean);
      }

      const response = await insertMemberReturnApp({
        order_app_id: item.order_app_id,
        shipping_address_id: shippingAddress?.shipping_address_id,
        mem_id: Number(memberInfo?.mem_id),
        return_type: selectedType === 'return' ? 'RETURN' : 'EXCHANGE',
        reason: selectedReason,
        file_ids: fileIds.length > 0 ? fileIds : undefined
      });

      if (response.success) {
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
  
  return (
    <>
      <CommonHeader 
        title={!returnData || returnData.length === 0 ? "반품/교환 신청" : "반품/교환 이력"}
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
            <Text style={styles.policyText}>제품이 물류센터 도착 후, 다음날부터 영업일 기준 검수시간 1~3일 후 반품이 완료됩니다</Text>
          </View>
          {!returnData || returnData.length === 0 ? (
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
                  <View style={[layoutStyle.rowAlignStart]}>
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
                        <Text style={[styles.productPrice]}>{Number(item?.payment_amount ?? 0).toLocaleString()}원</Text>
                        <Text style={[styles.productPrice, commonStyle.ml5]}>/ {item?.option_unit} {item?.order_quantity}개</Text>
                      </View>
                    </View>
                  </View>
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
                    
                    {selectedCommonCode === 'ETC_REASON' && (
                      <TextInput
                        style={styles.customReasonInput}
                        placeholder="기타 사유를 입력해주세요"
                        placeholderTextColor="#848484"
                        value={customReason}
                        onChangeText={setCustomReason}
                        multiline={true}
                        numberOfLines={3}
                        maxLength={200}
                      />
                    )}
                  </View>
                ) : (
                  <TextInput
                    style={styles.customReasonInput}
                    placeholder="교환 사유를 입력해주세요"
                    placeholderTextColor="#848484"
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline={true}
                    numberOfLines={3}
                    maxLength={200}
                  />
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

              <View style={styles.returnContainer}>
                <Text style={styles.returnTitle}>예상 {selectedType === 'return' ? '반품' : '교환'} 배송비</Text>
                <Text style={[styles.refundText, commonStyle.mt5, commonStyle.mb10]}>귀책에 따라 반품 배송비가 정해지며, 배송비는 <Text style={{color: '#202020'}}>착불</Text>로만 결제 가능합니다</Text>
                <View style={[layoutStyle.rowBetween, {marginBottom: scale(10)}]}>
                  <Text style={styles.refundText}>배송비</Text>
                  <Text style={styles.refundText}>{Number(getShippingFee() ?? 0).toLocaleString()}원</Text>
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
                    <Text style={styles.refundTitle}>환불금액</Text>
                  </View>
                    <>
                      <View style={[layoutStyle.rowBetween, {marginVertical: scale(5)}]}>
                        <Text style={styles.refundTotalTitle}>최종 환불 금액</Text>
                        <Text style={styles.refundTotalAmount}>{Number(item?.payment_amount ?? 0).toLocaleString()}원</Text>
                      </View>
                    </>
                </View>
              )}

              <View style={styles.requestContainer}>
                <TouchableOpacity 
                  style={[styles.requestBtn, isSubmitting && styles.disabledBtn]} 
                  onPress={handleReturnRequest}
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
          ) : (
            <View>
              {!returnData.length ? (
                <View style={styles.emptyContainer}>
                  <Image source={IMAGES.icons.xDocumentGray} style={styles.emptyIcon}/>
                  <Text style={styles.emptyText}>반품/교환 이력이 없어요</Text>
                </View>
              ) : (
                <View>
                  {returnData.map((item, index) => (
                    <View key={index} style={styles.returnDataContainer}>
                      <Text style={styles.returnStatus}>{item.return_status === 'RETURN_APPLY' ? '반품 신청 완료' : '교환 신청 완료'}</Text>
                      <View style={[layoutStyle.rowStart, commonStyle.mt10, commonStyle.mb10]}>
                        <Text style={styles.returnDt}>{item.reg_dt}</Text>
                        {/* <TouchableOpacity
                          style={[layoutStyle.rowStart, commonStyle.ml10]}
                          onPress={() => {
                            navigation.navigate('ShoppingOrderHistory', {
                              orderAppId: item.order_app_id
                            });
                          }}
                        >
                          <Text style={styles.returnDetail}>주문 상세</Text>
                          <Image source={IMAGES.icons.arrowRightGray} style={{width: scale(10), height: scale(10), resizeMode: 'contain'}} />
                        </TouchableOpacity> */}
                      </View>
                      <View style={[layoutStyle.rowAlignStart, commonStyle.mb10]}>
                        <TouchableOpacity
                          style={[layoutStyle.rowStart, commonStyle.ml10]}
                          onPress={() => {
                            navigation.navigate('ShoppingDetail', {
                              productParams: item
                            });
                          }}
                        >
                          <ShoppingThumbnailImg 
                            productAppId={item.product_app_id}
                            width={scale(70)} 
                            height={scale(70)}
                            style={styles.exchangeProductImage}
                            />
                          <View style={[commonStyle.ml10]}>
                            <Text style={styles.brandName}>{item.brand_name}</Text>
                            <Text style={styles.productName}>{item.product_name}</Text>
                            <View style={[layoutStyle.rowStart, {marginTop: scale(10)}]}>
                              <Text style={[styles.productPrice]}>{Number(item?.payment_amount ?? 0).toLocaleString()}원</Text>
                              <Text style={[commonStyle.ml5, styles?.productPrice]}>/ {item?.option_unit} {item?.order_quantity}개</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>

                      <View style={[layoutStyle.rowBetween, commonStyle.mt10, {gap: scale(5)}]}>
                        <TouchableOpacity 
                          style={styles.returnBtn}
                          onPress={() => {
                            navigation.navigate('ShoppingShipping', {
                              item: item,
                              screen: 'ShoppingReturn'
                            });
                          }}
                        >
                          <Text>버튼1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.returnBtn}>
                          <Text>버튼2</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      <CommonPopup
        backgroundColor="#FFFFFF"
        textColor="#202020"
        visible={popupVisible}
        message={popupMessage}
        onConfirm={() => setPopupVisible(false)}
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
      />
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
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(10),
    height: scale(100),
    
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
});

export default ShoppingReturn;
