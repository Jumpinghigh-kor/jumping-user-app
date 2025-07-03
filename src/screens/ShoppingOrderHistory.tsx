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
import { getMemberOrderAppList } from '../api/services/memberOrderAppService';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import CommonPopup from '../components/CommonPopup';
import { usePopup } from '../hooks/usePopup';
import { cancelPayment } from '../api/services/portoneService';


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
  
  // 결제 취소 함수
  const handleCancelPayment = async (orderItem: any) => {
    if (!orderItem.imp_uid) {
      showWarningPopup('결제 정보를 찾을 수 없습니다.');
      return;
    }

    showConfirmPopup(
      '결제를 취소하시겠습니까?',
      async () => {
        try {
          const response = await cancelPayment({
            imp_uid: orderItem.imp_uid,
            reason: '고객 요청에 의한 결제 취소'
          });

          if (response.success) {
            showWarningPopup('결제가 취소되었습니다.');
            // 주문 목록 다시 조회
            fetchOrderList();
          } else {
            showWarningPopup('결제 취소에 실패했습니다.');
          }
        } catch (error) {
          console.error('결제 취소 실패:', error);
          showWarningPopup('결제 취소 중 오류가 발생했습니다.');
        }
      }
    );
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
                  {orderAppList.map((item) => (
                    <View key={item.order_app_id} style={styles.orderItem}>
                      <View style={[layoutStyle.rowStart]}>
                        <Text style={styles.orderDate}>{item.order_dt}</Text>
                        <View style={styles.orderStatusContainer}>
                          <Text style={styles.orderStatusText}>
                            {item.order_status === 'SHIPPINGING' ? '배송중' : item.order_status === 'SHIPPING_COMPLETE' ? '배송완료' : item.order_status === 'PURCHASE_CONFIRM' ? '구매확정' : '결제완료'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderItemImgContainer}>
                        <TouchableOpacity 
                          style={styles.orderItemImgContainer}
                          onPress={() => {
                            const productData = {
                              product_app_id: item.product_app_id,
                              product_detail_app_id: item.product_detail_app_id,
                            };
                            navigation.navigate('ShoppingDetail' as never, { productParams: productData } as never);
                          }}
                        >
                          <ShoppingThumbnailImg
                            productAppId={item.product_app_id}
                            />
                          <View style={[layoutStyle.columnStretchEvenly, {marginLeft: scale(10), flex: 1}]}>
                            <Text style={styles.productName}>{item.brand_name}</Text>
                            <Text style={styles.productTitle} numberOfLines={2} ellipsizeMode="tail">{item.product_title}</Text>
                            <Text style={styles.productInfo}>{item.product_name} {item.option_amount}{item.option_unit} / {item.order_quantity}개</Text>
                            <Text style={styles.productPrice}>{item.order_price}원</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                      <View style={[layoutStyle.rowCenter]}>
                        {item.order_status === 'PAYMENT_COMPLETE' ? (
                          <>
                            <TouchableOpacity
                              style={[styles.bottomBtnContainer, commonStyle.mr5]}
                              onPress={() => handleCancelPayment(item)}
                            >
                              <Text style={styles.bottomBtnText}>결제 취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]}>
                              <Text style={styles.bottomBtnText}>문의하기</Text>
                            </TouchableOpacity>
                          </>
                        ) : item.order_status === 'SHIPPINGING' ? (
                          <>                        
                            <TouchableOpacity
                              style={[styles.bottomBtnContainer, commonStyle.mr5]}
                              onPress={() => navigation.navigate('ShoppingShipping' as never, { item } as never)}
                            >
                              <Text style={styles.bottomBtnText}>배송 현황</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]}>
                              <Text style={styles.bottomBtnText}>문의하기</Text>
                            </TouchableOpacity>
                          </>
                        ) : item.order_status === 'SHIPPING_COMPLETE' ? (
                          <>
                            <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.mr5]}>
                              <Text style={styles.bottomBtnText}>구매 확정</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.bottomBtnContainer, commonStyle.mr5]}
                              onPress={() => navigation.navigate('ShoppingReturn' as never, { item } as never)}
                            >
                              <Text style={styles.bottomBtnText}>반품/교환 요청</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <></>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}
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
    paddingVertical: scale(5),
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
});

export default ShoppingOrderHistory;
