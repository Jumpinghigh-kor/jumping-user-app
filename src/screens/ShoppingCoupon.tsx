import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
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

  useFocusEffect(
    useCallback(() => {
      loadMemberCouponList();
    }, [])
  );

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
        return (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.tabContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {activeCoupons.length > 0 ? (
              activeCoupons.map((coupon, index) => (
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
          </ScrollView>
        );
      case 'expired':
        const expiredCoupons = filterCoupons(true);
        return (
          <ScrollView 
            style={styles.tabContent} 
            contentContainerStyle={styles.tabContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {expiredCoupons.length > 0 ? (
              expiredCoupons.map((coupon, index) => (
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
    fontWeight: '500',
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
    fontWeight: '500',
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
  },
  tabContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShoppingCoupon;
