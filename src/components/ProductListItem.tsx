import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale } from '../utils/responsive';
import { supabase } from '../utils/supabaseClient';
import IMAGES from '../utils/images';
import { getProductAppThumbnailImg } from '../api/services/productAppService';
import { getMemberReviewAppList } from '../api/services/memberReviewAppService';
import { updateMemberZzimApp, insertMemberZzimApp, getMemberZzimAppDetail } from '../api/services/memberZzimAppService';
import { useAppSelector } from '../store/hooks';

// 상품 타입 정의
interface ProductType {
  product_app_id: number;
  title: string;
  original_price: number;
  price: number;
  discount: number;
  image?: string;
  image_url?: string;
  zzim_yn?: string | null;
  zzim_app_id?: number;
  big_category?: string;
  small_category?: string;
  reg_dt?: string;
}

// 썸네일 타입
interface ThumbnailType {
  product_app_id: number;
  file_path?: string;
  file_name?: string;
  image_url?: string;
}

// 리뷰 타입
interface ReviewType {
  product_app_id: number;
  star_point: number;
}

interface ProductListItemProps {
  item: ProductType;
  onPress: (item: ProductType) => void;
  thumbnailData?: ThumbnailType[];
  reviewData?: ReviewType[];
  layout?: 'grid' | 'list';
  onZzimPress?: (item: ProductType) => void;
  showReviews?: boolean;
}

const ProductListItem: React.FC<ProductListItemProps> = ({
  item,
  onPress,
  thumbnailData = [],
  reviewData = [],
  layout = 'grid',
  onZzimPress,
  showReviews = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [productThumbnailData, setProductThumbnailData] = useState<ThumbnailType[]>([]);
  const [productReviewData, setProductReviewData] = useState<ReviewType[]>([]);
  const [zzimState, setZzimState] = useState<'Y' | 'N' | null>(item.zzim_yn as 'Y' | 'N' | null);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  
  useEffect(() => {
    // 항목의 찜 상태가 변경되면 로컬 상태 업데이트
    setZzimState(item.zzim_yn as 'Y' | 'N' | null);
  }, [item.zzim_yn]);
  
  useEffect(() => {
    const fetchThumbnailData = async () => {
      try {
        const response = await getProductAppThumbnailImg();
        setProductThumbnailData(response.data);
      } catch (error) {
        
      }
    };
    
    fetchThumbnailData();
  }, []);
  
  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const response = await getMemberReviewAppList();
        setProductReviewData(response.data);
      } catch (error) {
        
      }
    };
    
    fetchReviewData();
  }, []);
  
  // 찜 업데이트 함수
  const handleZzimUpdate = async () => {
    if (!memberInfo?.mem_id) {
      return;
    }
    
    try {
      // 먼저 현재 찜 상태를 조회
      const detailResponse = await getMemberZzimAppDetail({
        mem_id: memberInfo.mem_id,
        product_app_id: item.product_app_id
      });
      
      if (detailResponse.success) {
        const currentZzimData = detailResponse.data;
        
        if (currentZzimData && currentZzimData.zzim_app_id) {
          // 찜 데이터가 있는 경우: 상태 토글
          const newZzimState = currentZzimData.zzim_yn === 'Y' ? 'N' : 'Y';
          
          const updateResponse = await updateMemberZzimApp({
            zzim_app_id: currentZzimData.zzim_app_id,
            zzim_yn: newZzimState,
            mem_id: memberInfo.mem_id
          });
          
          if (updateResponse.success) {
            setZzimState(newZzimState);
            
            if (onZzimPress) {
              const updatedItem = {
                ...item,
                zzim_yn: newZzimState,
                zzim_app_id: currentZzimData.zzim_app_id
              };
              onZzimPress(updatedItem);
            }
          }
        } else {
          // 찜 데이터가 없는 경우: 새로 생성
          const insertResponse = await insertMemberZzimApp({
            mem_id: memberInfo.mem_id,
            product_app_id: item.product_app_id
          });
          
          if (insertResponse.success) {
            setZzimState('Y');
            
            if (onZzimPress) {
              const updatedItem = {
                ...item,
                zzim_yn: 'Y',
                zzim_app_id: insertResponse.data?.zzim_app_id
              };
              onZzimPress(updatedItem);
            }
          }
        }
      }
    } catch (error) {
      
    }
  };
  
  // 제공된 썸네일 데이터 또는 로컬에서 가져온 데이터 사용
  const effectiveThumbnailData = thumbnailData.length > 0 ? thumbnailData : productThumbnailData;
  
  // 제공된 리뷰 데이터 또는 로컬에서 가져온 데이터 사용
  const effectiveReviewData = reviewData.length > 0 ? reviewData : productReviewData;
  
  // 이 상품에 대한 썸네일 데이터 찾기
  const thumbnailItem = effectiveThumbnailData.find(thumb => thumb.product_app_id === item.product_app_id);
  
  // 이 상품에 대한 리뷰 데이터 찾기
  const productReviews = effectiveReviewData?.filter(review => review.product_app_id === item.product_app_id) || [];
  const reviewCnt = productReviews.length;
  
  // 평균 별점 계산
  const avgStarPointRaw = productReviews.length > 0 
    ? (productReviews.reduce((sum, review) => sum + review.star_point, 0) / productReviews.length)
    : 0;
  
  // 소수점 형식: .0이면 정수로, 그렇지 않으면 소수점 첫째 자리까지 표시
  const avgStarPoint = avgStarPointRaw % 1 === 0 
    ? avgStarPointRaw.toFixed(0) 
    : avgStarPointRaw.toFixed(1);
  
  // Supabase에서 이미지 URL 가져오기 또는 직접 아이템에서 가져오기
  const getSupabaseImageUrl = () => {
    // 썸네일 데이터가 없으면 상품 이미지 반환
    if (!thumbnailItem) return item.image || item.image_url;
    
    // file_path와 file_name이 제공된 경우
    if (thumbnailItem.file_path && thumbnailItem.file_name) {
      const imagePath = `${thumbnailItem.file_path}/${thumbnailItem.file_name}`.replace(/^\//, '');
      const { data } = supabase.storage.from('product').getPublicUrl(imagePath);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    }

    // image_url이 제공된 경우
    if (thumbnailItem.image_url) {
      // 이미 전체 URL이 아닌 경우 Supabase URL로 변환
      if (!thumbnailItem.image_url.includes('http')) {
        const { data } = supabase.storage.from('product').getPublicUrl(thumbnailItem.image_url);
        if (data && data.publicUrl) {
          return data.publicUrl;
        }
      }
      return thumbnailItem.image_url;
    }
    
    // 아이템의 이미지나 이미지 URL로 폴백
    return item.image || item.image_url;
  };
  
  const imageUrl = getSupabaseImageUrl();
  
  // 최종 가격 계산
  const finalPrice = item.price || 
    (item.original_price && item.discount 
      ? Math.round(item.original_price * (1 - item.discount/100)) 
      : item.original_price);
  
  // 가격 콤마 형식화
  const formattedPrice = finalPrice 
    ? finalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") 
    : '0';
  
  // 원래 가격 콤마 형식화
  const formattedOriginalPrice = item.original_price 
    ? item.original_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") 
    : '0';
    
  return (
    <TouchableOpacity style={styles.gridItem} onPress={() => onPress(item)}>
      <View style={styles.imageContainer}>
        {!imageUrl ? (
          <View style={styles.noImageContainer}>
            <Image 
              source={IMAGES.icons.sadFaceGray} 
              style={{width: scale(30), height: scale(30)}} 
              onError={() => setImageError(true)} 
            />
            <Text style={styles.noImageText}>이미지가 없어요</Text>
          </View>
        ): (
          <Image 
            source={{uri: imageUrl}} 
            style={[styles.gridImage, {backgroundColor: '#EEEEEE'}]} 
            onError={() => setImageError(true)} 
          />
        )}
        <TouchableOpacity 
          style={styles.heartContainer}
          onPress={handleZzimUpdate}
        >
          <Image 
            source={zzimState === 'Y' ? IMAGES.icons.heartFillRed : IMAGES.icons.heartStrokeGray} 
            style={styles.heartIcon} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
        {item.discount > 0 && (
          <Text style={styles.originalPrice}>{formattedOriginalPrice}원</Text>
        )}
        <View style={styles.priceContainer}>
          {item.discount > 0 && (
            <Text style={styles.discount}>{item.discount}%</Text>
          )}
          <Text style={styles.price}>{formattedPrice}원</Text>
        </View>
        {showReviews && productReviews.length > 0 && (
          <View style={styles.ratingContainer}>
            <Image source={IMAGES.icons.starYellow} style={styles.starIcon} />
            <Text style={styles.avgStarPoint}>{avgStarPoint}</Text>
            <Text style={styles.reviewCnt}>후기 {reviewCnt}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridItem: {
    width: '48%',
    marginBottom: scale(16),
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
    borderRadius: scale(8),
    backgroundColor: '#EEEEEE',
  },
  noImageContainer: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
    borderRadius: scale(8),
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    color: '#848484',
    marginTop: scale(10),
  },
  heartContainer: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    zIndex: 1,
  },
  heartIcon: {
    width: scale(25),
    height: scale(25),
    resizeMode: 'contain',
  },
  productInfo: {
    padding: scale(10),
  },
  productName: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Regular',
    marginBottom: scale(4),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  price: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
  },
  originalPrice: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    color: '#CBCBCB',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: scale(14),
    color: '#FF3B30',
    fontFamily: 'Pretendard-SemiBold',
    marginRight: scale(8),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
  },
  avgStarPoint: {
    fontSize: scale(12),
    marginLeft: scale(4),
    marginRight: scale(8),
    fontFamily: 'Pretendard-Medium',
  },
  reviewCnt: {  
    fontSize: scale(12),
    color: '#848484',
    fontFamily: 'Pretendard-Medium',
  },
  
  // 리스트 레이아웃 스타일 (ShoppingZZim용)
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  listImage: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(5),
    backgroundColor: '#F5F5F5',
  },
  listProductInfo: {
    flex: 1,
    marginLeft: scale(15),
  },
  favoriteButton: {
    padding: scale(10),
  },
});

export default ProductListItem; 