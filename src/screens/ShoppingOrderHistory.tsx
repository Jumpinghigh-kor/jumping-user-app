import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { getMemberOrderAppList, updateOrderStatus } from '../api/services/memberOrderAppService';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import CommonPopup from '../components/CommonPopup';
import { usePopup } from '../hooks/usePopup';
import { cancelPayment } from '../api/services/portoneService';
import { insertMemberReturnApp, cancelMemberReturnApp, updateMemberReturnApp } from '../api/services/memberReturnAppService';
import { getCommonCodeList } from '../api/services/commonCodeService';
import Clipboard from '@react-native-clipboard/clipboard';


const ShoppingOrderHistory = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [orderAppList, setOrderAppList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { popup, showWarningPopup, showConfirmPopup } = usePopup();
  const [orderStatusTypes, setOrderStatusTypes] = useState<Array<{label: string, value: string}>>([]);
  const [returnReasons, setReturnReasons] = useState<Array<{label: string, value: string}>>([]);
  const [selectedReturnReason, setSelectedReturnReason] = useState<string>('');
  const [showReasonDropdown, setShowReasonDropdown] = useState<boolean>(false);
  const [returnReasonDetail, setReturnReasonDetail] = useState<string>('');
  const [pendingOrderItem, setPendingOrderItem] = useState<any | null>(null);
  const [cancelQuantity, setCancelQuantity] = useState<string>('');

  // ORDER_STATUS_TYPE 라벨 매핑
  const getOrderStatusLabel = (value: string) => {
    const found = orderStatusTypes.find(t => t.value === value);
    return found ? found.label : value;
  };

  // 공통코드: 주문상태 타입 로드
  useEffect(() => {
    const loadOrderStatusTypes = async () => {
      try {
        const res = await getCommonCodeList({ group_code: 'ORDER_STATUS_TYPE' });
        if (res.success && res.data) {
          const types = res.data.map((item: any) => ({
            label: item.common_code_name,
            value: item.common_code,
          }));
          setOrderStatusTypes(types);
        }
      } catch (e) {
        // ignore
      }
    };
    loadOrderStatusTypes();
  }, []);

  // 공통코드: 반품/취소 사유 목록 (팝업 표시 시 로드)
  useEffect(() => {
    const loadReturnReasons = async () => {
      try {
        const res = await getCommonCodeList({ group_code: 'RETURN_REASON_TYPE' });
        if (res.success && res.data) {
          const list = res.data.map((item: any) => ({
            label: item.common_code_name,
            value: item.common_code,
          }));
          setReturnReasons(list);
        }
      } catch (e) {
        setReturnReasons([]);
      }
    };
    if (popup.visible) {
      loadReturnReasons();
    } else {
      setReturnReasons([]);
      setSelectedReturnReason('');
    }
  }, [popup.visible]);

  // 현재 년도 기준 5년전까지 배열 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    ...Array.from({ length: 5 }, (_, i) => ({ value: (currentYear - i).toString(), label: `${currentYear - i}년` }))
  ];

  // 주문 목록 조회 함수
  const fetchOrderList = async () => {
    if (memberInfo?.mem_id) {
      try {
        const params: any = {
          mem_id: memberInfo.mem_id,
          screen_type: 'ORDER_HISTORY'
        };
        
        // selectedYear가 있을 때만 year 파라미터 추가
        if (selectedYear) {
          params.year = selectedYear;
        }

        if (searchQuery) {
          params.search_title = searchQuery;
        }
        
        const response = await getMemberOrderAppList(params);
        
        if (response.success) {
          setOrderAppList(response.data || []);
        }
      } catch (error) {
        console.error('주문내역 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchOrderList();
    }, [memberInfo?.mem_id, selectedYear, searchQuery])
  );

  // CANCEL_APPLY + 반품/취소 접수 통합 처리
  const insertCancelApply = async (targetOrderItem: any) => {
    if (!targetOrderItem) return;
    let statusUpdated = false;

    try {
      const paymentAppId = Number(targetOrderItem.payment_app_id);
      if (!paymentAppId) {
        showWarningPopup('결제번호를 확인할 수 없습니다.');
        return;
      }
      await updateOrderStatus({
        order_detail_app_ids: [Number(targetOrderItem.order_detail_app_id)],
        mem_id: Number(memberInfo?.mem_id),
        order_status: 'CANCEL_APPLY',
      } as any);
      statusUpdated = true;
      
      if (!statusUpdated) return;

      const samePaymentItems = orderAppList.filter((it: any) => Number(it.payment_app_id) === paymentAppId);
      const hasReturnApp = samePaymentItems.some((it: any) => !!it.return_app_id);

      if (hasReturnApp) {
        await updateMemberReturnApp({
          order_detail_app_ids: samePaymentItems.map((it: any) => Number(it.order_detail_app_id)),
          mem_id: Number(memberInfo?.mem_id),
          cancel_yn: 'N',
          return_reason_type: selectedReturnReason,
          reason: returnReasonDetail || '',
        } as any);
      } else {
        await Promise.all(
          samePaymentItems.map((it: any) =>
            insertMemberReturnApp({
              order_detail_app_id: it.order_detail_app_id,
              mem_id: Number(memberInfo?.mem_id),
              return_applicator: 'BUYER',
              return_reason_type: selectedReturnReason,
              reason: returnReasonDetail || '',
              quantity: it.order_detail_app_id === targetOrderItem.order_detail_app_id
                ? Number(cancelQuantity || it.order_quantity || 0)
                : it.order_quantity,
            } as any)
          )
        );
      }
    } catch (e) {
      console.log('insertCancelApply error', e);
    }
  };

  // 취소접수 취소 처리 (반품접수 취소 + 상태 복구)
  const cancelCancelApply = async (firstItem: any) => {
    try {
      const samePaymentItems = orderAppList.filter((it: any) => Number(it.payment_app_id) === Number(firstItem.payment_app_id));
      let statusUpdated = false;
      
      await updateOrderStatus({
        order_detail_app_ids: samePaymentItems.map((it: any) => Number(it.order_detail_app_id)),
        mem_id: Number(memberInfo?.mem_id),
        order_status: 'PAYMENT_COMPLETE',
        order_group: 1,
      } as any);
      statusUpdated = true;
      
      if (!statusUpdated) return;

      await cancelMemberReturnApp({
        order_detail_app_ids: samePaymentItems.map((it: any) => Number(it.order_detail_app_id)),
        mem_id: Number(memberInfo?.mem_id),
      } as any);
      await fetchOrderList();
    } catch (e) {
      console.log('cancelCancelApply error', e);
    }
  };

  return (
    <>
      <CommonHeader 
        title="주문내역"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        onBackPress={() => navigation.navigate('ShoppingMypage')}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#40B649" />
          </View>
        ) : (
          <>
            <View style={styles.searchContainer}>
              {!isSearching ? (
                <TouchableOpacity 
                  style={[layoutStyle.rowCenter, styles.searchIconContainer]}
                  onPress={() => setIsSearching(true)}
                >
                  <Image source={IMAGES.icons.searchStrokeBlack} style={styles.searchIcon} />
                  <Text style={styles.searchText}>검색</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.searchInputContainer}>
                  <Image source={IMAGES.icons.searchStrokeBlack} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="검색어를 입력하세요"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) {
                        setIsSearching(false);
                      }
                    }}
                  />
                  <TouchableOpacity onPress={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}>
                    <Text style={styles.cancelText}>취소</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.yearContainer}>
                <TouchableOpacity 
                  style={styles.searchYearContainer}
                  onPress={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <Text>{`${selectedYear}년`}</Text>
                </TouchableOpacity>
                
                {/* 년도 드롭박스 */}
                {showYearDropdown && (
                  <View style={styles.yearDropdown}>
                    {yearOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.yearOption,
                          selectedYear.toString() === option.value && styles.selectedYearOption
                        ]}
                        onPress={() => {
                          setSelectedYear(parseInt(option.value));
                          setShowYearDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.yearOptionText,
                          selectedYear.toString() === option.value && styles.selectedYearOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {
              !orderAppList.length ? (
                <View style={styles.emptyContainer}>
                  <Image source={IMAGES.icons.orderGray} style={styles.speechIcon} />
                  <Text style={styles.emptyText}>주문한 내역이 없어요</Text>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[commonStyle.pb50]}
                  alwaysBounceVertical={false}
                  bounces={false}
                >
                  {Object.values(orderAppList.reduce((acc: any, cur: any) => {
                    (acc[cur.payment_app_id] = acc[cur.payment_app_id] || []).push(cur);
                    return acc;
                  }, {} as Record<string, any[]>)).map((group: any[]) => {
                    const first = group[0];
                    return (
                      <View key={first.order_app_id} style={styles.orderItem}>
                        <View style={[layoutStyle.rowStart]}>
                          <Text style={styles.orderDate}>{first.order_dt}</Text>
                          <View style={[styles.orderStatusContainer, {backgroundColor: first.order_status == 'CANCEL_APPLY' ? '#000' : '#42B649'}]}>
                            <Text style={styles.orderStatusText}>{getOrderStatusLabel(first.order_status)}</Text>
                          </View>
                        </View>
                        {group.map((gi: any, index: number) => (
                          <View key={gi.order_app_id}>
                            <View style={[styles.orderItemImgContainer, {borderTopWidth: index == 0 ? 0 : 2, borderTopColor: '#EEEEEE', marginHorizontal: -scale(16), paddingHorizontal: scale(16),}]}>
                              <TouchableOpacity 
                                style={styles.orderItemImgContainer}
                                onPress={() => {
                                  const productData = {
                                    product_app_id: gi.product_app_id,
                                    product_detail_app_id: gi.product_detail_app_id,
                                  };
                                  navigation.navigate('ShoppingDetail' as never, { productParams: productData } as never);
                                }}
                              >
                                <ShoppingThumbnailImg
                                  productAppId={gi.product_app_id}
                                />
                                <View style={[layoutStyle.columnStretchEvenly, {marginLeft: scale(10), flex: 1}]}> 
                                  <Text style={styles.productName}>{gi.brand_name}</Text>
                                  <Text style={styles.productTitle} numberOfLines={2} ellipsizeMode="tail">{gi.product_title}</Text>
                                  <Text style={styles.productInfo}>{gi.product_name} {gi.option_amount}{gi.option_unit}({gi.option_gender == 'W' ? '여성' : gi.option_gender == 'M' ? '남성' : '공용'}) / {gi.order_quantity}개</Text>
                                  <Text style={styles.productPrice}>{(Number(String((gi.price) ?? 0).replace(/,/g, '')) * Number((gi.order_quantity) ?? 0)).toLocaleString()}원</Text>
                                </View>
                              </TouchableOpacity>
                              </View>
                              <View style={[layoutStyle.rowCenter, commonStyle.mt10]}>
                                {gi.order_status === 'PAYMENT_COMPLETE' ? (
                                  <>
                                    <TouchableOpacity
                                      style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                      onPress={() => {
                                        setPendingOrderItem({ ...gi, order_status: 'CANCEL_APPLY' });
                                        setCancelQuantity('1');
                                        showConfirmPopup('결제를 취소하시겠습니까?', () => {}, () => {});
                                      }}
                                    >
                                      <Text style={styles.bottomBtnText}>결제 취소 접수</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                      const phone = gi?.inquiry_phone_number || '';
                                      if (phone) {
                                        Clipboard.setString(String(phone));
                                      }
                                    }}>
                                      <Text style={styles.bottomBtnText}>문의하기</Text>
                                    </TouchableOpacity>
                                  </>
                                ) : gi.order_status === 'SHIPPINGING' ? (
                                  <>
                                    <TouchableOpacity
                                      style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                      onPress={() => navigation.navigate('ShoppingShipping' as never, { item: gi } as never)}
                                    >
                                      <Text style={styles.bottomBtnText}>배송 현황</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                      const phone = gi?.inquiry_phone_number || '';
                                      if (phone) {
                                        Clipboard.setString(String(phone));
                                      }
                                    }}>
                                      <Text style={styles.bottomBtnText}>문의하기</Text>
                                    </TouchableOpacity>
                                  </>
                                ) : gi.order_status === 'SHIPPING_COMPLETE' ? (
                                  <>
                                    <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.mr5]}>
                                      <Text style={styles.bottomBtnText}>구매 확정</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                      onPress={() => navigation.navigate('ShoppingReturn' as never, { item: gi } as never)}
                                    >
                                      <Text style={styles.bottomBtnText}>반품/교환 요청</Text>
                                    </TouchableOpacity>
                                  </>
                                ) : gi.order_status === 'CANCEL_APPLY' ? (
                                  <>
                                    <TouchableOpacity
                                      style={[styles.bottomBtnContainer, commonStyle.mr5]}
                                      onPress={() => cancelCancelApply(gi)}
                                    >
                                      <Text style={styles.bottomBtnText}>결제 취소 접수 철회</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]} onPress={() => {
                                      const phone = gi?.inquiry_phone_number || '';
                                      if (phone) {
                                        Clipboard.setString(String(phone));
                                      }
                                    }}>
                                      <Text style={styles.bottomBtnText}>문의하기</Text>
                                    </TouchableOpacity>
                                  </>
                                ) : (
                                  <></>
                                )}
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}
      </View>

      <CommonPopup
        visible={popup.visible}
        message={popup.message}
        titleWeight="bold"
        backgroundColor="#FFFFFF"
        textColor="#202020"
        type={popup.type}
        onConfirm={async () => {
          if (!selectedReturnReason) {
            showWarningPopup('사유를 선택하세요.');
            return;
          }
          const maxQty = Number(pendingOrderItem?.order_quantity ?? 0);
          const qtyNum = Number(cancelQuantity);
          if (!qtyNum || qtyNum < 1 || qtyNum > maxQty) {
            showWarningPopup(`유효한 취소 수량(1~${maxQty})을 입력하세요.`);
            return;
          }
          if (pendingOrderItem) {
            await insertCancelApply(pendingOrderItem);
            setPendingOrderItem(null);
          }
          if (popup.onConfirm) {
            popup.onConfirm();
          }
          await fetchOrderList();
        }}
        onCancel={() => { if (popup.onCancel) { popup.onCancel(); } }}
        confirmText="확인"
        cancelText="취소"
      >
        <View style={{ width: '100%', marginBottom: scale(10) }}>
          {/* 사유 선택 셀렉트 박스 */}
          <TouchableOpacity
            onPress={() => setShowReasonDropdown(!showReasonDropdown)}
            style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: scale(6),
              paddingVertical: scale(10),
              paddingHorizontal: scale(12),
              backgroundColor: '#FFFFFF',
              marginBottom: scale(8),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: '#202020', fontSize: scale(12) }}>
              {selectedReturnReason
                ? (returnReasons.find(r => r.value === selectedReturnReason)?.label || '사유 선택')
                : '사유를 선택하세요'}
            </Text>
            <Image source={showReasonDropdown ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} style={styles.arrowDownIcon} />
          </TouchableOpacity>
          {showReasonDropdown && (
            <View style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: scale(6),
              backgroundColor: '#FFFFFF',
              marginBottom: scale(8),
            }}>
              {returnReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  onPress={() => {
                    setSelectedReturnReason(reason.value);
                    setShowReasonDropdown(false);
                  }}
                  style={{ paddingVertical: scale(10), paddingHorizontal: scale(12) }}
                >
                  <Text style={{ color: '#202020', fontSize: scale(13) }}>{reason.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 상세 사유 입력 (선택사항) */}
          <TextInput
            value={returnReasonDetail}
            onChangeText={setReturnReasonDetail}
            placeholder="상세 사유를 입력하세요 (선택사항)"
            placeholderTextColor="#9E9E9E"
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#D9D9D9',
              borderRadius: scale(6),
              paddingVertical: scale(10),
              paddingHorizontal: scale(12),
              minHeight: scale(80),
              textAlignVertical: 'top',
              backgroundColor: '#FFFFFF',
              fontSize: scale(12),
            }}
          />

          {/* 취소 수량 입력 */}
          {pendingOrderItem && (
            <View style={{ marginTop: scale(8), marginBottom: scale(14) }}>
              <Text style={{ marginBottom: scale(6), color: '#202020', fontSize: scale(12) }}>
                취소 수량 (최대 {pendingOrderItem?.order_quantity})
              </Text>
              <TextInput
                value={cancelQuantity}
                onChangeText={(t) => {
                  const digits = t.replace(/[^0-9]/g, '');
                  if (!digits) {
                    setCancelQuantity('');
                    return;
                  }
                  const num = Number(digits);
                  const max = Number(pendingOrderItem?.order_quantity ?? 0);
                  const clamped = num > max ? max : num;
                  setCancelQuantity(String(clamped));
                }}
                placeholder={`취소 수량을 입력해주세요`}
                placeholderTextColor="#9E9E9E"
                keyboardType="number-pad"
                style={{
                  borderWidth: 1,
                  borderColor: '#D9D9D9',
                  borderRadius: scale(6),
                  paddingVertical: scale(10),
                  paddingHorizontal: scale(12),
                  backgroundColor: '#FFFFFF',
                  fontSize: scale(12),
                }}
              />
            </View>
          )}
        </View>
      </CommonPopup>
    </>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
  },
  searchIconContainer: {
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(14),
    gap: scale(4),
    marginRight: scale(8),
  },
  searchIcon: {
    width: scale(13),
    height: scale(13),
    resizeMode: 'contain',
  },
  searchText: {
    fontSize: scale(14),
    color: '#202020',
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(14),
    flex: 1,
    marginRight: scale(8),
    gap: scale(4),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(14),
    color: '#202020',
    paddingVertical: 0,
  },
  cancelText: {
    fontSize: scale(12),
    color: '#848484',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: scale(120),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: scale(80),
  },
  speechIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(14),
    color: '#CBCBCB',
    fontWeight: 'bold',
    marginTop: scale(10),
  },
  orderItem: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(25),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  orderDate: {
    fontSize: scale(18),
    color: '#202020',
    fontWeight: '600',
  },
  orderStatusContainer: {
    backgroundColor: '#42B649',
    borderRadius: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    marginLeft: scale(10),
  },
  orderStatusText: {
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  orderItemImgContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: scale(16),
  },
  productName: {
    fontSize: scale(14),
    color: '#202020',
    fontWeight: '600',
  },
  productTitle: {
    fontSize: scale(12),
    color: '#202020',
  },
  productInfo: {
    fontSize: scale(12),
    color: '#848484',
  },
  productPrice: {
    fontSize: scale(14),
    color: '#202020',
    fontWeight: '600',
  },
  bottomBtnContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: scale(10),
    borderRadius: scale(5),
    marginTop: scale(16),
  },
  bottomBtnText: {
    fontSize: scale(12),
    color: '#202020',
    fontWeight: '600',
    textAlign: 'center',
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearDropdown: {
    position: 'absolute',
    top: scale(35),
    left: scale(4.5),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(5),
    maxHeight: scale(250),
    zIndex: 1000,
    overflow: 'hidden',
  },
  yearOption: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  selectedYearOption: {
    backgroundColor: '#EEEEEE',
  },
  yearOptionText: {
    fontSize: scale(14),
    color: '#202020',
    textAlign: 'center',
  },
  selectedYearOptionText: {
    color: '#202020',
  },
  searchYearContainer: {
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(14),
  },
  arrowDownIcon: {
    width: scale(13),
    height: scale(13),
    resizeMode: 'contain',
  },
});

export default ShoppingOrderHistory;
