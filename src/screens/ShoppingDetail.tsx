import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getProductAppImgDetail } from '../api/services/productAppService';
import { getMemberReviewAppList } from '../api/services/memberReviewAppService';
import { supabase } from '../utils/supabaseClient';
import { useProfileImage } from '../hooks/useProfileImage';
import ProfileImagePicker from '../components/ProfileImagePicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 리뷰 아이템 컴포넌트 분리
const ReviewItem = ({ review }) => {
  const { profileImageUrl, loadProfileImage } = useProfileImage(review.mem_id);
  
  useEffect(() => {
    loadProfileImage();
  }, []);
  
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewProfile}>
        <View style={styles.profileImageContainer}>
          <ProfileImagePicker
            memId={review.mem_id}
            currentImageUrl={profileImageUrl}
            onImageUpdate={() => {}}
            showEditIcon={false}
          />
        </View>
        <View style={styles.reviewContent}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>{review.mem_nickname}</Text>
          </View>
          <View style={styles.reviewStarsRow}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Image
                  key={`star_${star}`} 
                  source={star <= review.star_point ? IMAGES.icons.starYellow : IMAGES.icons.starGray}
                  style={styles.starIcon}
                />
              ))}
            </View>
            <Text style={styles.reviewDate}>{review.reg_dt}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.reviewText}>{review.content}</Text>
    </View>
  );
};

const ShoppingDetail = ({route, navigation}) => {
  const {product} = route.params;
  const [productImages, setProductImages] = useState([]);
  const [detailImages, setDetailImages] = useState([]);
  const [reviewData, setReviewData] = useState([]);
  const [avgStarPoint, setAvgStarPoint] = useState(product.rating || "0");
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'review', 'inquiry'
  const [isWished, setIsWished] = useState(false);
  const scrollViewRef = useRef(null);

  // Supabase URL 생성
  const getSupabaseImageUrl = (imageData) => {
    if (!imageData) return product.image;
    
    // file_path와 file_name으로 이미지 경로 생성
    if (imageData.file_path && imageData.file_name) {
      const imagePath = `${imageData.file_path}/${imageData.file_name}`.replace(/^\//, '');
      const { data } = supabase.storage.from('product').getPublicUrl(imagePath);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    }
    
    // image_url이 있는 경우
    if (imageData.image_url) {
      // 경로만 있는 경우 Supabase URL로 변환
      if (!imageData.image_url.includes('http')) {
        const { data } = supabase.storage.from('product').getPublicUrl(imageData.image_url);
        if (data && data.publicUrl) {
          return data.publicUrl;
        }
      }
      return imageData.image_url;
    }
    
    return product.image;
  };

  useEffect(() => {
    const fetchProductImages = async () => {
      try {
        const response = await getProductAppImgDetail({
          product_app_id: product.product_app_id
        });
        if (response.success) {
          // Ensure response.data is an array
          const imageArray = Array.isArray(response.data) ? response.data : [];
          
          // Filter out any null or undefined items first
          const validImages = imageArray.filter(img => img != null);
          
          // Then filter images to only include those with img_form or image_form set to "REPRESENTER"
          const representerImages = validImages.filter((img: any) => 
            (img.img_form === "REPRESENTER") || 
            (img.image_form === "REPRESENTER") ||
            (img.form === "REPRESENTER")
          );
          
          // Find detail images
          const detailImages = validImages.filter((img: any) => 
            (img.img_form === "DETAIL") || 
            (img.image_form === "DETAIL") ||
            (img.form === "DETAIL")
          );

          // Set images, ensuring there's at least one valid image
          if (representerImages.length > 0) {
            setProductImages(representerImages);
          } else if (validImages.length > 0) {
            setProductImages(validImages);
          } else {
            // If no valid images, create a single-item array with product.image
            setProductImages([{ image_url: product.image }]);
          }
          
          // Set detail images
          setDetailImages(detailImages.length > 0 ? detailImages : []);
        }
      } catch (error) {
        console.error('상품 이미지 로드 오류:', error);
        // Fallback to product image if there's an error
        setProductImages([{ image_url: product.image }]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductImages();
  }, [product.product_app_id]);

  const handleCartPress = () => {
    navigation.navigate('CartScreen');
  };

  const handleAddToCart = () => {
    // 실제 구현에서는 Context API나 Redux 등으로 장바구니 상태를 관리해야 합니다
    Alert.alert(
      '장바구니 추가',
      `"${product.name}" 상품이 장바구니에 추가되었습니다.`,
      [
        {
          text: '쇼핑 계속하기',
          style: 'cancel',
        },
        {
          text: '장바구니 보기',
          onPress: () => navigation.navigate('CartScreen'),
        },
      ]
    );
  };

  const cartIcon = (
    <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
      <Icon name="cart-outline" style={styles.cartIcon} size={24} color="#000" />
    </TouchableOpacity>
  );

  // 인디케이터 점 렌더링 함수
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {productImages.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.dot, 
              index === activeSlide && styles.activeDot
            ]} 
          />
        ))}
      </View>
    );
  };

  // FlatList 렌더 아이템
  const renderItem = ({ item, index }) => {
    const imageUrl = getSupabaseImageUrl(item);
    
    return (
      <View style={[styles.slide, { width: screenWidth }]}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    
    if (newIndex !== activeSlide) {
      setActiveSlide(newIndex);
    }
  };

  // 탭 전환 함수
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    
    // 리뷰 탭 선택 시 리뷰 데이터 로드
    if (tab === 'review' && reviewData.length === 0) {
      loadReviews();
    }
  };
  
  // 리뷰 데이터 로드
  const loadReviews = async () => {
    try {
      const response = await getMemberReviewAppList({
        product_app_id: product.product_app_id
      });
      
      if (response.success && response.data) {
        // star_point 평균값 계산
        const starPoints = response.data.map(review => review.star_point).filter(Boolean);
        if (starPoints.length > 0) {
          const sum = starPoints.reduce((total, point) => total + point, 0);
          const average = sum / starPoints.length;
          setAvgStarPoint(average.toFixed(1));
        }
        
        setReviewData(response.data);
      }
    } catch (error) {
      console.error('리뷰 데이터 로드 오류:', error);
    }
  };
  
  // 탭 렌더링 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <View>
            {detailImages.length > 0 ? (
              detailImages.map((item, index) => (
                <Image 
                  key={`detail_${index}`}
                  source={{ uri: getSupabaseImageUrl(item) }}
                  style={styles.detailImage}
                  resizeMode="contain"
                />
              ))
            ) : (
              <Text>상품 상세 이미지가 없습니다.</Text>
            )}
          </View>
        );
      case 'review':
        return (
          <View>
            {reviewData.length > 0 ? (
              <View>
                {/* 리뷰 목록 */}
                {reviewData.map((review, index) => (
                  <ReviewItem key={`review_${index}`} review={review} />
                ))}
              </View>
            ) : (
              <View style={styles.noReviewContainer}>
                <Image source={IMAGES.icons.speechGray} style={styles.noReviewIcon} />
                <Text style={styles.noReviewText}>작성된 리뷰가 없어요</Text>
              </View>
            )}
          </View>
        );
      case 'inquiry':
        return (
          <View>
            <Text>
              상품에 대한 문의사항이 있으시면 이곳에 남겨주세요.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <CommonHeader 
        title=""
        backIcon={IMAGES.icons.arrowLeftBlack}
        rightIcon={cartIcon}
        backgroundColor="#FFFFFF"
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: scale(80)}}
        >
          <View style={styles.imageOuterContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6BC46A" />
              </View>
            ) : productImages && productImages.length > 0 ? (
              <View>
                <FlatList
                  ref={scrollViewRef}
                  data={productImages}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => `slide_${index}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  style={styles.slider}
                  scrollEventThrottle={16}
                />
                {productImages.length > 0 && renderDots()}
              </View>
            ) : (
              <Image 
                source={{uri: product.image}} 
                style={styles.productImage} 
                resizeMode="contain"
              />
            )}
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.title}</Text>
            
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Image 
                  key={`star_${star}`} 
                  source={star <= parseFloat(avgStarPoint) ? IMAGES.icons.starYellow : IMAGES.icons.starGray} 
                  style={styles.starIcon} 
                />
              ))}
              <Text style={styles.rating}>{avgStarPoint}</Text>
            </View>
            
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <View style={styles.discountContainer}>
                  <Text style={styles.discount}>{product.discount}%</Text>
                  <Text style={styles.originalPrice}>{product.original_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원</Text>
                </View>
              </View>
                <Text style={styles.price}>{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원</Text>
            </View>
            
            <View style={styles.divider} />
            
            {/* 탭 메뉴 */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'info' && styles.activeTab]} 
                onPress={() => handleTabPress('info')}
              >
                <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>상품정보</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'review' && styles.activeTab]} 
                onPress={() => handleTabPress('review')}
              >
                <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>리뷰</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'inquiry' && styles.activeTab]} 
                onPress={() => handleTabPress('inquiry')}
              >
                <Text style={[styles.tabText, activeTab === 'inquiry' && styles.activeTabText]}>문의</Text>
              </TouchableOpacity>
            </View>
            
            {/* 탭 컨텐츠 */}
            {renderTabContent()}
          </View>
        </ScrollView>
        
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.wishButton} 
            onPress={() => setIsWished(!isWished)}
          >
            <Icon name={isWished ? "heart" : "heart-outline"} size={24} color={isWished ? "#F04D4D" : "#202020"} />
            <Text style={styles.wishText}>찜</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyText}>구매하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageOuterContainer: {
    width: '100%',
  },
  slider: {
    width: screenWidth,
    height: scale(400),
  },
  slide: {
    width: screenWidth,
    height: scale(400),  
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEEEEE',
  },
  productImage: {
    width: screenWidth,
    height: scale(100),
    resizeMode: 'contain',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: scale(10),
    width: '100%',
  },
  paginationDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  paginationInactiveDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  productInfo: {
    padding: 16,
  },
  loadingContainer: {
    width: screenWidth,
    height: scale(400),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEEEEE',
  },
  productName: {
    fontSize: scale(22),
    fontWeight: 'bold',
    marginBottom: scale(10),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  rating: {
    fontSize: scale(14),
    fontWeight: '500',
    marginLeft: scale(4),
    marginRight: scale(10),
  },
  priceContainer: {
    marginBottom: scale(16),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: scale(24),
    fontWeight: 'bold',
    marginRight: scale(10),
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: scale(14),
    color: '#CBCBCB',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: scale(14),
    color: '#F04D4D',
    marginRight: scale(10),
  },
  divider: {
    height: scale(8),
    backgroundColor: '#EEEEEE',
    marginTop: scale(16),
    marginHorizontal: -scale(16),
  },
  starIcon: {
    width: scale(14),
    height: scale(14),
    resizeMode: 'contain',
    marginRight: scale(2),
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    height: scale(70),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  wishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#202020',
    marginLeft: scale(3),
  },
  buyButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    backgroundColor: '#43B546',
    fontSize: scale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    borderRadius: scale(30),
    paddingHorizontal: scale(15),
    paddingVertical: scale(8),
  },
  cartButton: {
    width: scale(40),
    alignItems: 'flex-end'
  },
  cartIcon: {
    // width: scale(40),
    // height: scale(40),
  },
  dotsContainer: {
    position: 'absolute',
    bottom: scale(10),
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginHorizontal: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#43B546',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingHorizontal: scale(16),
    paddingVertical: scale(15),
  },
  tab: {
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#43B546',
  },
  tabText: {
    fontSize: scale(14),
    color: '#202020',
  },
  activeTabText: {
    color: '#43B546',
    fontWeight: 'bold',
  },
  detailImage: {
    width: '100%',
    height: scale(300),
    marginBottom: scale(10),
  },
  reviewItem: {
    paddingVertical: scale(20),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  reviewProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -scale(10),
    marginBottom: scale(10),
  },
  profileImageContainer: {
    marginRight: scale(5),
    transform: [{ scale: 0.8 }],
  },
  reviewContent: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewHeader: {
    marginBottom: scale(4),
  },
  reviewerName: {
    fontSize: scale(14),
    fontWeight: '500',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: scale(14),
  },
  reviewDate: {
    fontSize: scale(12),
    color: '#999',
  },
  starsRow: {
    flexDirection: 'row',
  },
  noReviewContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noReviewIcon: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
  },
  noReviewText: {
    textAlign: 'center',
    color: '#848484',
    fontSize: scale(14),
    fontWeight: '600',
    marginTop: scale(10),
  },
});

export default ShoppingDetail; 