import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CommonHeader from '../components/CommonHeader';
import CommonPopup from '../components/CommonPopup';
import { scale } from '../utils/responsive';
import { useAppSelector } from '../store/hooks';
import IMAGES from '../utils/images';
import { ScrollView } from 'react-native-gesture-handler';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { WebView } from 'react-native-webview';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { axiosInstance } from '../api/config/axiosConfig';

// 네비게이션 타입 정의
type RootStackParamList = {
  ShoppingHome: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShoppingHome'>;

const ShoppingShipping = (props: any) => {
  const orderData = props.route.params.item;
  const screen = props.route.params.screen;
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [trackingData, setTrackingData] = useState(null);
  const [showRateLimitPopup, setShowRateLimitPopup] = useState(false);
  
  // 배송 추적 정보 조회
  const fetchTrackingInfo = async () => {
    try {
      let companyName = '';

      if(screen == 'ShoppingReturn' && orderData?.company_courier_code) {
        companyName = orderData?.company_courier_code;
      } else if(screen == 'ShoppingReturn' && !orderData?.company_courier_code) {
        companyName = orderData?.customer_courier_code;
      } else {
        companyName = orderData?.courier_code;
      }

      let trackingNumber = '';

      if(screen == 'ShoppingReturn' && orderData?.company_tracking_number) {
        trackingNumber = orderData?.company_tracking_number;
      } else if(screen == 'ShoppingReturn' && !orderData?.company_tracking_number) {
        trackingNumber = orderData?.customer_tracking_number;
      } else {
        trackingNumber = orderData?.tracking_number;
      }

      const response = await axiosInstance.post('delivery-tracker/getTrackingInfo', {
        companyName,
        trackingNumber,
      });
      const result = response?.data;

      if (result?.success) {
        setTrackingData(result?.data);
      } else if (result?.isRateLimit) {
        setShowRateLimitPopup(true);
      }
    } catch (error) {
      console.error('배송 추적 오류:', error.response.data.message);
    } finally {
    }
  };
  
  useFocusEffect(() => {
    fetchTrackingInfo();
  });

  // 당겨서 새로고침
  const { refreshing, onRefresh } = usePullToRefresh(fetchTrackingInfo, []);

  // 프로그레스바 width 계산 함수
  const getProgressWidth = () => {
    const statusCode = trackingData?.statusCode;
    
    if (!statusCode) {
      return '0%';
    }
    
    switch (statusCode) {
      case 'AT_PICKUP':
        return '0%';
      case 'IN_TRANSIT':
        // 간선하차인지 확인 (location이나 description에서 판단)
        const isAtDestination = trackingData?.trackingDetails?.some(detail => 
          detail.status?.includes('간선하차')
        );
        return isAtDestination ? '50%' : '25%';
      case 'OUT_FOR_DELIVERY':
        return '75%';
      case 'DELIVERED':
        return '100%';
      default:
        // 미정의/UNKNOWN 상태는 꽉 찬 막대를 표시하지 않음
        return '0%';
    }
  };
  
  return (
    <>
      <CommonHeader 
        title={screen == 'ShoppingReturn' ? '반품/교환 배송 현황' : '배송 현황'}
        titleColor="#000000"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        titleWidth="36%"
        emptyAreaWidth="30.7%"
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          // alwaysBounceVertical={false}
          // bounces={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#43B546"
              colors={["#43B546"]}
            />
          }
        >
          <View style={styles.barContainer}>
            <View style={styles.barItem}>
              <Image 
                source={
                  trackingData?.statusCode == 'AT_PICKUP' ? IMAGES.icons.documentStrokeBlack002
                  : trackingData?.statusCode == 'IN_TRANSIT' && trackingData?.trackingDetails?.some(detail => 
                    detail.status?.includes('간선하차')
                  ) ? IMAGES.icons.homeStrokeBlack002
                  : trackingData?.statusCode == 'IN_TRANSIT' && !trackingData?.trackingDetails?.some(detail => 
                    detail.status?.includes('간선하차')
                  ) ? IMAGES.icons.truckStrokeBlack
                  : trackingData?.statusCode == 'OUT_FOR_DELIVERY' ? IMAGES.icons.truckStrokeBlack
                  : IMAGES.icons.deliveryHandStrokeBlack
                }
                style={trackingData?.statusCode == 'IN_TRANSIT' && trackingData?.trackingDetails?.some(detail => 
                  detail.status?.includes('간선하차')
                ) ? {width: scale(80), height: scale(80), resizeMode: 'contain'} : styles.deliveryGif}
              />
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: getProgressWidth() }]} />
              </View>
              <View style={styles.stepsContainer}>
                <Text style={styles.stepText}>인수</Text>
                <Text style={styles.stepText}>이동중</Text>
                <Text style={styles.stepText}>배달지</Text>
                <Text style={styles.stepText}>배달중</Text>
                <Text style={styles.stepText}>완료</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoTitleItem}>
              <Text style={styles.infoTitle}>택배 상세정보</Text>
              {orderData?.courier_code && (
                <Text style={styles.infoPhone}>{orderData?.courier_code == 'CJ' ? '1588-1255'
                                                                              :  orderData?.courier_code == 'ROZEN' ? '1588-9988'
                                                                              :  orderData?.courier_code == 'HANJIN' ? '1588-0011'
                                                                              :  orderData?.courier_code == 'LOTTE' ? '1588-2121'
                                                                              :  orderData?.courier_code == 'EPOST' ? '1588-1300' : '-'}</Text>
              )}
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>택배사</Text>
              <Text style={styles.infoValue}>
                {orderData?.courier_code == 'CJ' ? 'CJ대한통운'
                                                  : orderData?.courier_code == 'ROZEN' ? '로젠택배'
                                                  : orderData?.courier_code == 'HANJIN' ? '한진택배'
                                                  : orderData?.courier_code == 'LOTTE' ? '롯데택배'
                                                  : orderData?.courier_code == 'EPOST' ? '우체국택배' : '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>운송장 번호</Text>
              <Text style={styles.infoValue}>{trackingData?.trackingNumber || orderData?.tracking_number || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>보낸 사람</Text>
              <Text style={styles.infoValue}>{memberInfo?.mem_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>받는 사람</Text>
              <Text style={styles.infoValue}>
                {orderData?.receiver_name ? orderData?.receiver_name 
                                          : (screen == 'ShoppingReturn' && !orderData?.company_tracking_number) ? orderData?.brand_name : '-'}
              </Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>배송 현황</Text>
            {trackingData?.trackingDetails?.length > 0 ? (
              trackingData?.trackingDetails?.slice().reverse().map((detail, index) => (
                <View key={index} style={styles.statusItem}>
                  <View style={styles.statusDateContainer}>
                    <Text style={styles.statusDate}>
                      {new Date(detail.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }).replace(/. /g, '.').replace(/\.$/, '')}
                    </Text>
                    <Text style={styles.statusTime}>
                      {new Date(detail.date).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </Text>
                  </View>
                  <Text style={styles.statusAddress}>{detail.location}</Text>
                  <Text style={styles.statusStatus}>{detail.status}</Text>
                </View>
              ))
            ) : (
              <View style={[layoutStyle.alignCenter, commonStyle.pt50]}>
                <Text style={styles.loadingText}>배송 현황이 없어요</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      
      <CommonPopup
        type="warning"
        visible={showRateLimitPopup}
        message={`현재 사용량이 많습니다.${'\n'}3~5분 후 다시 시도해주세요.`}
        onConfirm={() => setShowRateLimitPopup(false)}
        backgroundColor="#FFFFFF"
        textColor='#202020'
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: scale(16),
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
  },
  barItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  barText: {  
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#000000',
  },
  barTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
    marginBottom: scale(20),
  },
  progressBarBackground: {
    width: '100%',
    height: scale(12),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(20),
    marginBottom: scale(10),
    marginTop: scale(20),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#42B649',
    borderRadius: scale(20),
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  stepText: {
    fontSize: scale(14),
    color: '#202020',
  },
  infoContainer: {
    marginTop: scale(40),
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  infoTitleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(15),
  },  
  infoTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Medium',
    color: '#202020',
  },
  infoPhone: {  
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(20),
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: scale(10),
  },
  infoLabel: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
    width: scale(100),
  },
  infoValue: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
  },
  statusContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(20),
  },
  statusTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Medium',
    color: '#202020',
    marginBottom: scale(15),
  },
  statusItem: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  statusDateContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  statusDate: { 
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#848484',
  },
  statusTime: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#848484',
  },
  statusAddress: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
  },
  statusStatus: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    color: '#202020',
  },
  loadingText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#848484',
  },
  deliveryGif: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
  },
});

export default ShoppingShipping;
