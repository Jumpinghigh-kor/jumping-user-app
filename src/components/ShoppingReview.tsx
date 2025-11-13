import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';

interface ShoppingReviewProps {
  productAppId: number;
  reviewData: any[];
}

const ShoppingReview: React.FC<ShoppingReviewProps> = ({ productAppId, reviewData }) => {
  // 리뷰 데이터에서 현재 상품의 리뷰 찾기
  const productReviews = reviewData?.filter(review => review.product_app_id === productAppId) || [];
  const reviewCnt = productReviews.length;
  
  // 리뷰 평균 평점 계산
  const avgStarPointRaw = productReviews.length > 0 
    ? (productReviews.reduce((sum, review) => sum + review.star_point, 0) / productReviews.length)
    : 0;
  
  // 소수점 처리: 소수점이 .0으로 끝나면 정수로, 아니면 소수점 첫째자리까지만 표시
  const avgStarPoint = avgStarPointRaw % 1 === 0 
    ? avgStarPointRaw.toFixed(0) 
    : avgStarPointRaw.toFixed(1);

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(avgStarPointRaw);
    const halfStar = avgStarPointRaw % 1 >= 0.5;

    // 꽉 찬 별
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Image key={`full-${i}`} source={IMAGES.icons.starYellow} style={styles.starIcon} />
      );
    }

    // 반 별
    if (halfStar) {
      stars.push(
        <Image key="half" source={IMAGES.icons.starHalfYellow} style={styles.starIcon} />
      );
    }

    // 빈 별
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Image key={`empty-${i}`} source={IMAGES.icons.starGray} style={styles.starIcon} />
      );
    }

    return stars;
  };

  return (
    <View style={styles.reviewContainer}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      <Text style={styles.commentText}>평점 {avgStarPoint} ({reviewCnt})</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: scale(4),
  },
  commentText: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#848484',
  },
  starIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
    marginRight: scale(1),
  },
});

export default ShoppingReview; 