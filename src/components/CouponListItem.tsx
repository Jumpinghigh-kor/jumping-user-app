import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { layoutStyle } from '../styles/common';

interface CouponListItemProps {
  coupon: any;
  index: number;
  showDownloadButton?: boolean;
  onDownload?: (coupon: any) => void;
  isIssued?: boolean;
  isExpired?: boolean;
}

const CouponListItem: React.FC<CouponListItemProps> = ({
  coupon,
  index,
  showDownloadButton = false,
  onDownload,
  isIssued = false,
  isExpired = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;

  // 쿠폰 뒤집기 핸들러
  const handleFlipCoupon = () => {
    const toValue = isFlipped ? 0 : 180;

    Animated.timing(animationValue, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // 애니메이션 중간에 내용 변경
    setTimeout(() => {
      setIsFlipped(!isFlipped);
    }, 300);
  };

  // 남은 일수 계산 함수
  const calculateRemainingDays = (endDate) => {
    if (!endDate) return 0;
    
    try {
      const dateParts = endDate.split('.');
      if (dateParts.length !== 3) return 0;
      
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);
      
      const today = new Date();
      const end = new Date(year, month, day);
      
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const timeDiff = end.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff > 0 ? daysDiff : 0;
    } catch (error) {
      return 0;
    }
  };

  const remainingDays = calculateRemainingDays(coupon.end_dt);

  return (
    <View style={[styles.couponItemContainer, isExpired && styles.expiredCouponContainer]}>
      <Animated.View 
        style={[
          layoutStyle.rowBetween,
          {
            transform: [{
              rotateY: animationValue.interpolate({
                inputRange: [0, 180],
                outputRange: ['0deg', '180deg']
              })
            }]
          }
        ]}
      >
        <View style={{width: isFlipped ? '100%' : (showDownloadButton ? '75%' : '100%'), padding: scale(16)}}>
          {!isFlipped ? (
            // 앞면
            <>
              <View style={[layoutStyle.rowBetween, {height: scale(30)}]}>
                <Text style={[styles.couponItemTitle, isExpired && styles.expiredText]}>{coupon.discount_amount}{coupon.discount_type === 'PERCENT' ? '%' : '원'} 할인</Text>
                <TouchableOpacity onPress={handleFlipCoupon}>
                  <Image source={isExpired ? IMAGES.icons.informationCircleGray : IMAGES.icons.informationCircleGreen} style={{width: scale(16), height: scale(16), resizeMode: 'contain'}} />
                </TouchableOpacity>
              </View>
              <View style={{height: scale(90)}}>
                <Text style={[styles.couponItemDesc, isExpired && styles.expiredText]} numberOfLines={2}>
                  {coupon.description}
                </Text>
                {coupon.badge_text && (
                  <View style={[styles.badgeContainer, isExpired && styles.expiredBadgeContainer]}>
                    <Text style={styles.badgeText}>{coupon.badge_text}</Text>
                  </View>
                )}
              </View>
              <View style={{height: scale(45), paddingTop: scale(25)}}>
                <Text style={[styles.couponDt, isExpired && styles.expiredText]}>
                  {coupon.start_dt} ~ {coupon.end_dt} ({remainingDays}일 남음)
                </Text>
              </View>
            </>
          ) : (
            // 뒷면
            <View style={{transform: [{scaleX: -1}]}}>
              <View style={[layoutStyle.rowBetween]}>
                <Text style={[styles.couponItemTitle, isExpired && styles.expiredText]}>이용약관</Text>
                <TouchableOpacity onPress={handleFlipCoupon}>
                  <Image source={isExpired ? IMAGES.icons.flipGray : IMAGES.icons.flipGreen} style={[{width: scale(14), height: scale(14), resizeMode: 'contain'}]} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.couponItemDesc, isExpired && styles.expiredText]}>
                {coupon.coupon_notice}
              </Text>
            </View>
          )}
        </View>
        {showDownloadButton && !isFlipped && (
          <View style={{borderLeftWidth: 1, borderColor: isExpired ? '#F6F6F6' : '#43B546', width: '25%', alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', marginVertical: scale(10) }}>
            <TouchableOpacity
              onPress={() => onDownload && onDownload(coupon)}
              disabled={isIssued}
            >
              <Image source={isIssued ? IMAGES.icons.downloadCircleGray : IMAGES.icons.downloadCircleGreen} style={styles.downloadImg} />
            </TouchableOpacity>
            {isIssued && (
              <Text style={{fontSize: scale(10), color: '#848484', fontWeight: '600', marginTop: scale(5)}}>발급 완료</Text>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  couponItemContainer: {
    borderWidth: 1,
    borderColor: '#43B546',
    borderRadius: scale(10),
    marginBottom: scale(20),
    minHeight: scale(200),
  },
  expiredCouponContainer: {
    borderColor: '#F6F6F6',
    backgroundColor: '#F6F6F6',
  },
  couponItemTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#202020',
  },
  couponItemDesc: {
    fontSize: scale(14),
    color: '#202020',
    marginTop: scale(10),
  },
  expiredText: {
    color: '#848484',
  },
  badgeContainer: {
    backgroundColor: '#F04D4D',
    borderRadius: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    marginTop: scale(5),
    alignSelf: 'flex-start',
  },
  expiredBadgeContainer: {
    backgroundColor: '#848484',
  },
  badgeText: {
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  couponDt: {
    fontSize: scale(12),
    color: '#848484',
    // marginTop: scale(40),
  },
  downloadImg: {
    width: scale(35),
    height: scale(35),
    resizeMode: 'contain',
  },
});

export default CouponListItem; 