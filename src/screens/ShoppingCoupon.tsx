import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';
import { getMemberCouponAppList, insertMemberCouponApp } from '../api/services/memberCouponApp';
import CouponListItem from '../components/CouponListItem';


const ShoppingCoupon = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [activeTab, setActiveTab] = useState('my');
  const [couponList, setCouponList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pageMy, setPageMy] = useState(1);
  const [pageExpired, setPageExpired] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // 탭 전환 핸들러
  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  // 멤버 쿠폰 리스트 로드
  const loadMemberCouponList = async () => {
    try {
      const response = await getMemberCouponAppList({
        mem_id: memberInfo?.mem_id
      });
      
      if (response.success && response.data) {
        setCouponList(response.data);
      }
    } catch (error: any) {
      console.error('멤버 쿠폰 리스트 로드 실패:', error.response.data);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMemberCouponList();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMemberCouponList();
    }, [])
  );

  useEffect(() => {
    setPageMy(1);
    setPageExpired(1);
  }, [activeTab, couponList.length]);

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    // 현재 날짜를 YYYYMMDDHHIISS 형식으로 생성
    const getCurrentDateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };

    const currentDateTime = getCurrentDateTime();

    // 쿠폰 필터링
    const filterCoupons = (isExpired = false) => {
      if (!couponList || couponList.length === 0) return [];
      
      return couponList.filter(coupon => {
        const isUsed = coupon.use_yn === 'Y';
        const isDateExpired = coupon.full_end_dt && currentDateTime > coupon.full_end_dt;
        const isCouponExpired = isUsed || isDateExpired;
        
        return isExpired ? isCouponExpired : !isCouponExpired;
      });
    };

    switch (activeTab) {
      case 'my':
        const activeCoupons = filterCoupons(false);
        const displayedActiveCoupons = activeCoupons.slice(0, pageMy * 5);
        return (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.tabContentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#43B546"
                colors={["#43B546"]}
                progressBackgroundColor="#FFFFFF"
              />
            }
            onScroll={(e) => {
              try {
                const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent || {};
                const paddingToBottom = 50;
                if (layoutMeasurement && contentOffset && contentSize) {
                  const isNearEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                  if (isNearEnd && !loadingMore && displayedActiveCoupons.length < activeCoupons.length) {
                    setLoadingMore(true);
                    setTimeout(() => {
                      setPageMy(prev => prev + 1);
                      setLoadingMore(false);
                    }, 300);
                  }
                }
              } catch {}
            }}
            scrollEventThrottle={16}
          >
            {displayedActiveCoupons.length > 0 ? (
              displayedActiveCoupons.map((coupon, index) => (
                <CouponListItem
                  key={index}
                  coupon={coupon}
                  index={index}
                  showDownloadButton={false}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Image source={IMAGES.icons.xDocumentGray} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>내 쿠폰이 없어요</Text>
              </View>
            )}
            {(loadingMore && displayedActiveCoupons.length < activeCoupons.length) && (
              <View style={{ paddingVertical: scale(12), alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#43B546" />
              </View>
            )}
          </ScrollView>
        );
      case 'expired':
        const expiredCoupons = filterCoupons(true);
        const displayedExpiredCoupons = expiredCoupons.slice(0, pageExpired * 5);
        return (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.tabContentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#43B546"
                colors={["#43B546"]}
                progressBackgroundColor="#FFFFFF"
              />
            }
            onScroll={(e) => {
              try {
                const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent || {};
                const paddingToBottom = 50;
                if (layoutMeasurement && contentOffset && contentSize) {
                  const isNearEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                  if (isNearEnd && !loadingMore && displayedExpiredCoupons.length < expiredCoupons.length) {
                    setLoadingMore(true);
                    setTimeout(() => {
                      setPageExpired(prev => prev + 1);
                      setLoadingMore(false);
                    }, 300);
                  }
                }
              } catch {}
            }}
            scrollEventThrottle={16}
          >
            {displayedExpiredCoupons.length > 0 ? (
              displayedExpiredCoupons.map((coupon, index) => (
                <CouponListItem
                  key={index}
                  coupon={coupon}
                  index={index}
                  showDownloadButton={false}
                  isExpired={true}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Image source={IMAGES.icons.xDocumentGray} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>만료된 쿠폰이 없어요</Text>
              </View>
            )}
            {(loadingMore && displayedExpiredCoupons.length < expiredCoupons.length) && (
              <View style={{ paddingVertical: scale(12), alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#43B546" />
              </View>
            )}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <CommonHeader 
        title="쿠폰"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        {/* 탭 메뉴 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'my' && styles.activeTabButton]} 
            onPress={() => handleTabPress('my')}
          >
            <Text style={[
              styles.tabButtonText, 
              activeTab === 'my' && styles.activeTabButtonText
            ]}>
              내 쿠폰
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'expired' && styles.activeTabButton]} 
            onPress={() => handleTabPress('expired')}
          >
            <Text style={[
              styles.tabButtonText, 
              activeTab === 'expired' && styles.activeTabButtonText
            ]}>
              만료 쿠폰
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 탭 컨텐츠 */}
        {renderTabContent()}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabButton: {
    width: '50%',
    height: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonText: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Medium',
    color: '#848484',
  },
  activeTabButtonText: {
    color: '#000000',
  },
  activeTabButton: {
    borderBottomWidth: scale(2),
    borderBottomColor: '#000000',
  },
  tabContent: {
    flex: 1,
    padding: scale(20),
  },
  testButton: {
    backgroundColor: '#000000',
    padding: scale(10),
    borderRadius: scale(5),
    marginTop: scale(20),
  },
  testButtonText: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyIcon: {
    width: scale(50),
    height: scale(50),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(14),
    color: '#CBCBCB',
    marginTop: scale(10),
    fontFamily: 'Pretendard-Medium',
  },
  tabContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShoppingCoupon;
