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
import {useNavigation} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';
import { commonStyle, layoutStyle } from '../styles/common';
import { getMemberOrderAppList } from '../api/services/memberOrderAppService';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';


const ShoppingOrderHistory = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [orderAppList, setOrderAppList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // 현재 년도 기준 5년전까지 배열 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  useEffect(() => {
    setLoading(true);
    const fetchOrderList = async () => {
      if (memberInfo?.mem_id) {
        try {
          const response = await getMemberOrderAppList({
            mem_id: memberInfo.mem_id,
            screen_type: 'ORDER_HISTORY'
          });
          
          if (response.success && response.data) {
            setOrderAppList(response.data);
          }
        } catch (error) {
          console.error('주문내역 조회 실패:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrderList();
  }, [memberInfo?.mem_id]);
console.log(orderAppList);
  return (
    <>
      <CommonHeader 
        title="주문내역"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#40B649" />
          </View>
        ) : (
          <>
            <View style={styles.searchContainer}>
              <TouchableOpacity style={[layoutStyle.rowCenter, styles.searchIconContainer]}>
                <Image source={IMAGES.icons.searchStrokeBlack} style={styles.searchIcon} />
                <Text style={styles.searchText}>검색</Text>
              </TouchableOpacity>
              <View style={styles.yearContainer}>
                <TouchableOpacity 
                  style={styles.searchYearContainer}
                  onPress={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <Text>{selectedYear}</Text>
                </TouchableOpacity>
                
                {/* 년도 드롭박스 */}
                {showYearDropdown && (
                  <View style={styles.yearDropdown}>
                    {yearOptions.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.yearOption,
                          selectedYear === year && styles.selectedYearOption
                        ]}
                        onPress={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.yearOptionText,
                          selectedYear === year && styles.selectedYearOptionText
                        ]}>
                          {year}년
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
                >
                  {orderAppList.map((item) => (
                    <View key={item.order_app_id} style={styles.orderItem}>
                      <View style={[layoutStyle.rowStart]}>
                        <Text style={styles.orderDate}>{item.order_dt}</Text>
                        <View style={styles.orderStatusContainer}>
                          <Text style={styles.orderStatusText}>
                            {item.order_status === 'SHIPPINGING' ? '배송중' : item.order_status === 'SHIPPING_COMPLETE' ? '배송완료' : item.order_status === 'PURCHASE_CONFIRM' ? '구매확정' : '상품준비중'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderItemImgContainer}>
                        <ShoppingThumbnailImg
                          productAppId={item.product_app_id}
                          />
                        <View style={[layoutStyle.columnStretchEvenly, {marginLeft: scale(10), flex: 1}]}>
                          <Text style={styles.productName}>{item.brand_name}</Text>
                          <Text style={styles.productTitle} numberOfLines={2} ellipsizeMode="tail">{item.product_title}</Text>
                          <Text style={styles.productInfo}>{item.product_name} {item.option_amount}{item.option_unit} / {item.order_quantity}개</Text>
                          <Text style={styles.productPrice}>{item.order_price}원</Text>
                        </View>
                    </View>
                    <View style={[layoutStyle.rowCenter]}>
                      <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.mr5]}>
                        <Text style={styles.bottomBtnText}>배송 현황</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.bottomBtnContainer, commonStyle.ml5]}>
                        <Text style={styles.bottomBtnText}>문의하기</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>
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
  searchYearContainer: {
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(20),
    paddingVertical: scale(5),
    paddingHorizontal: scale(14),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(5),
    maxHeight: scale(200),
    minWidth: scale(80),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  yearOption: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  selectedYearOption: {
    backgroundColor: '#42B649',
  },
  yearOptionText: {
    fontSize: scale(14),
    color: '#202020',
    textAlign: 'center',
  },
  selectedYearOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ShoppingOrderHistory;
