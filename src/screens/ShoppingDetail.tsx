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
  FlatList,
  Platform,
  Modal,
  PanResponder,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getProductAppImgDetail } from '../api/services/productAppService';
import { getMemberReviewAppList } from '../api/services/memberReviewAppService';
import { updateMemberZzimApp, getMemberZzimAppDetail, insertMemberZzimApp } from '../api/services/memberZzimAppService';
import { supabase } from '../utils/supabaseClient';
import { useProfileImage } from '../hooks/useProfileImage';
import ProfileImagePicker from '../components/ProfileImagePicker';
import ShoppingReview from '../components/ShoppingReview';
import { useAppSelector } from '../store/hooks';
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
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewText}>{review.content}</Text>
    </View>
  );
};

// 상세 이미지 컴포넌트 분리
const DetailImage = ({ imageData, getSupabaseImageUrl }) => {
  const [imageHeight, setImageHeight] = useState(300); // 기본 높이
  const imageUrl = getSupabaseImageUrl(imageData);
  
  return (
    <Image 
      source={{ uri: imageUrl }}
      style={{ 
        width: '100%',
        height: imageHeight,
        marginBottom: scale(10),
      }}
      resizeMode="cover"
      onLoad={(event) => {
        const { width, height } = event.nativeEvent.source;
        const screenWidth = Dimensions.get('window').width;
        const scaleFactor = screenWidth / width;
        setImageHeight(height * scaleFactor);
      }}
    />
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
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const scrollViewRef = useRef(null);
  const [zzimData, setZzimData] = useState(null); // 찜 데이터 저장용 상태 추가

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
    loadReviews(); // 초기 로드 시 리뷰 데이터도 함께 가져오기
  }, [product.product_app_id]);
  
  // 초기 찜 상태 확인
  useEffect(() => {
    const checkInitialWishStatus = async () => {
      try {
        if (memberInfo?.mem_id) {
          const zzimResponse = await getMemberZzimAppDetail({
            mem_id: memberInfo.mem_id,
            product_app_id: product.product_app_id
          });
          
          if (zzimResponse.success && zzimResponse.data) {
            setIsWished(zzimResponse.data.zzim_yn === 'Y');
            setZzimData(zzimResponse.data); // 찜 데이터 저장
          }
        }
      } catch (error) {
        console.error('초기 찜 상태 확인 오류:', error);
      }
    };
    
    checkInitialWishStatus();
  }, [isWished]);

  const handleCartPress = () => {
    navigation.navigate('ShoppingCart');
  };

  const cartIcon = (
    <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
      <Image source={IMAGES.icons.cartStrokeBlack} style={styles.cartIcon} />
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
          resizeMode="cover"
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
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: scale(20) }}
              >
                {detailImages.map((item, index) => (
                  <DetailImage 
                    key={`detail_${index}`}
                    imageData={item}
                    getSupabaseImageUrl={getSupabaseImageUrl}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noTabContainer}>
                <Image source={IMAGES.icons.sadFaceGray} style={styles.noTabIcon} />
                <Text style={styles.noTabText}>상품 상세 이미지가 없어요</Text>
              </View>
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
              <View style={styles.noTabContainer}>
                <Image source={IMAGES.icons.speechGray} style={styles.noTabIcon} />
                <Text style={styles.noTabText}>작성된 리뷰가 없어요</Text>
              </View>
            )}
          </View>
        );
      case 'inquiry':
        return (
          <View style={styles.inquiryContainer}>
            <Text style={styles.inquiryTitle}>해당 상품이 궁금하신가요?</Text>
            <Text style={styles.inquiryDesc}>상품 관련 문의가 궁금하시다면 아래 번호로{'\n'}전화 또는 문자 주시기 바랍니다.</Text>
            <View style={styles.inquiryButtonContainer}>
              <TouchableOpacity style={styles.inquiryButton}>
                <Text style={styles.inquiryButtonText}>010-1234-5678</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };
  
  // 구매하기 모달 열기
  const handlePurchaseClick = () => {
    setShowPurchaseModal(true);
  };

  // 구매하기 모달 닫기
  const handleCloseModal = () => {
    setShowPurchaseModal(false);
  };
  
  // Modify the wishlist button handler
  const handleWishButtonClick = async () => {
    try {
      const newWishState = !isWished;
      
      // 즉시 UI 업데이트
      setIsWished(newWishState);

      // 이미 찜 데이터가 있을 경우 (zzimData가 있을 경우 업데이트)
      if (zzimData && zzimData.zzim_app_id) {
        const response = await updateMemberZzimApp({
          mem_id: memberInfo?.mem_id,
          zzim_yn: newWishState ? 'Y' : 'N',
          zzim_app_id: zzimData.zzim_app_id
        });
        
        // 업데이트 성공 시 찜 데이터 갱신
        if (response.success) {
          setZzimData({
            ...zzimData,
            zzim_yn: newWishState ? 'Y' : 'N'
          });
        } else {
          // 실패시 UI 되돌리기
          setIsWished(!newWishState);
        }
      } 
      // 찜 데이터가 없는 경우 (최초 찜하기)
      else {
        const insertResponse = await insertMemberZzimApp({
          mem_id: memberInfo?.mem_id,
          product_app_id: product.product_app_id
        });
        
        if (insertResponse.success) {
          // 등록 성공 시 찜 데이터 저장
          const newZzimData = {
            zzim_app_id: insertResponse.data.zzim_app_id,
            zzim_yn: 'Y',
            mem_id: memberInfo?.mem_id,
            product_app_id: product.product_app_id
          };

          setZzimData(newZzimData);
        } else {
          // 실패시 UI 되돌리기
          setIsWished(!newWishState);
          console.error('찜 등록 실패:', insertResponse.message);
        }
      }
    } catch (error) {
      // 에러 발생 시 UI 되돌리기
      setIsWished(!isWished);
      console.error('찜 상태 변경 오류:', error);
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
                <ActivityIndicator size="large" color="#43B546" />
              </View>
            ) : productImages[0]?.file_name ? (
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
              <View style={[styles.noImageContainer, {backgroundColor: '#EEEEEE'}]}>
                <Image source={IMAGES.icons.sadFaceGray} style={styles.noImageIcon} />
                <Text style={styles.noImageText}>상품 이미지가 없어요</Text>
            </View>
            )}
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.title}</Text>
            
            {reviewData && reviewData.length > 0 ? (
              <ShoppingReview 
                productAppId={product.product_app_id} 
                reviewData={reviewData}
              />
            ) : (
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
            )}
            
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                {product.discount > 0 && (
                  <View style={styles.discountContainer}>
                    <Text style={styles.discount}>{product.discount}%</Text>
                    <Text style={styles.originalPrice}>{product.original_price}원</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.price, {marginTop: product.discount > 0 ? scale(5) : scale(0)}]}>{product.price}원</Text>
            </View>
            
            <View style={{marginTop: scale(10), marginBottom: scale(25), borderBottomWidth: 1, borderBottomColor: '#EEEEEE', marginHorizontal: -scale(20)}} />
            
            <View style={styles.deliveryContainer}>
              <Text style={styles.deliveryTitle}>배송</Text>
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.deliveryText}>무료배송</Text>
                  <Image source={IMAGES.icons.infoGray} style={styles.deliveryInfoIcon} />
                </View>
                <Text style={styles.deliveryDate}><Text style={{fontWeight: '600'}}>04.08(화)</Text> 이내 판매자 발송예정</Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            {/* 탭 메뉴 */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tabButton]} 
                onPress={() => handleTabPress('info')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'info' && styles.activeTabButtonText]}>상품정보</Text>
                {activeTab === 'info' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton]} 
                onPress={() => handleTabPress('review')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'review' && styles.activeTabButtonText]}>리뷰</Text>
                {activeTab === 'review' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton]} 
                onPress={() => handleTabPress('inquiry')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'inquiry' && styles.activeTabButtonText]}>문의</Text>
                {activeTab === 'inquiry' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            </View>
            
            {/* 탭 컨텐츠 */}
            {renderTabContent()}
          </View>
        </ScrollView>
        
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.wishButton} 
            onPress={handleWishButtonClick}
          >
            <Icon name={isWished ? "heart" : "heart-outline"} size={24} color={isWished ? "#F04D4D" : "#202020"} />
            <Text style={styles.wishText}>찜</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton} onPress={handlePurchaseClick}>
            <Text style={styles.buyText}>구매하기</Text>
          </TouchableOpacity>
        </View>

        {/* 구매하기 모달 */}
        <CustomPurchaseModal 
          visible={showPurchaseModal}
          onClose={handleCloseModal}
          product={product}
        />
      </View>
    </>
  );
};

// 커스텀 구매 모달 컴포넌트
const CustomPurchaseModal = ({ visible, onClose, product }) => {
  const translateY = new Animated.Value(0);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true
        }).start(onClose);
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true
        }).start();
      }
    }
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={purchaseModalStyles.overlay}>
        <Animated.View 
          style={[
            purchaseModalStyles.content,
            { transform: [{ translateY }] }
          ]}
        >
          <View 
            style={purchaseModalStyles.dragArea}
            {...panResponder.panHandlers}
          >
            <View style={purchaseModalStyles.barContainer}>
              <Image source={IMAGES.icons.smallBarLightGray} style={purchaseModalStyles.bar} />
            </View>
          </View>
          
          <TouchableOpacity style={purchaseModalStyles.selectBox}>
            <Text style={purchaseModalStyles.selectBoxText}>상품을 선택해주세요</Text>
            <Image source={IMAGES.icons.arrowDownGray} style={purchaseModalStyles.arrowDownIcon} />
          </TouchableOpacity>

          <View style={purchaseModalStyles.buttonContainer}>
            <TouchableOpacity style={purchaseModalStyles.cartButton} onPress={onClose}>
              <Text style={purchaseModalStyles.cartButtonText}>장바구니</Text>
            </TouchableOpacity>          
            <TouchableOpacity style={purchaseModalStyles.confirmButton} onPress={onClose}>
              <Text style={purchaseModalStyles.confirmButtonText}>구매하기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 구매 모달 스타일
const purchaseModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingTop: scale(10),
    minHeight: scale(300),
  },
  dragArea: {
    alignItems: 'center',
    marginBottom: scale(15),
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    width: scale(40),
    height: scale(4),
    resizeMode: 'contain',
  },
  title: {
    fontSize: scale(18),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: scale(20),
    color: '#202020',
  },
  productInfoContainer: {
    marginBottom: scale(20),
  },
  productName: {
    fontSize: scale(16),
    marginBottom: scale(10),
    color: '#202020',
  },
  productPrice: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#202020',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: scale(10),
  },
  confirmButton: {
    backgroundColor: '#43B546',
    borderRadius: scale(30),
    paddingVertical: scale(15),
    alignItems: 'center',
    width: '48%',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  cartButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: scale(30),
    paddingVertical: scale(15),
    alignItems: 'center',
    width: '48%',
  },
  cartButtonText: {
    color: '#71717',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: scale(10),
    padding: scale(15),
    marginBottom: scale(20),
  },
  selectBoxText: {
    fontSize: scale(14),
    color: '#202020',
  },
  arrowDownIcon: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
  },
});

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
    height: scale(450),  
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEEEEE',
  },
  productImage: {
    width: screenWidth,
    height: scale(450),
    resizeMode: 'cover',
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
    marginBottom: scale(14),
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
    marginTop: scale(10),
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
    // height: scale(70),
    paddingHorizontal: scale(16),
    paddingVertical: scale(20),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 15,
        shadowColor: '#000',
      },
    }),
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
    backgroundColor: '#43B546',
    borderRadius: scale(30),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
  },
  buyText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cartButton: {
    width: scale(40),
    alignItems: 'flex-end'
  },
  cartIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
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
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    marginHorizontal: -scale(16),
  },
  tabButton: {
    width: '33.33%',
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#202020',
  },
  activeTabButtonText: {
    color: '#43B546',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -3,
    left: '25%',
    right: '25%',
    height: scale(3),
    backgroundColor: '#43B546',
    borderRadius: scale(1.5),
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
  reviewTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(10),
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
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deliveryTitle: {
    fontSize: scale(14),
    marginRight: scale(10),
    color: '#848484',
  },
  deliveryText: {
    fontSize: scale(14),
    color: '#202020',
  },
  deliveryInfoIcon: {
    width: scale(14),
    height: scale(14),
    resizeMode: 'contain',
    marginLeft: scale(5),
  },
  deliveryDate: {
    marginTop: scale(5),
    fontSize: scale(14),
    color: '#848484',
  },
  noImageContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth,
    height: scale(400),
  },
  noImageIcon: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
  },
  noImageText: {  
    fontSize: scale(14),
    color: '#848484',
    marginTop: scale(10),
  },
  noTabContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth,
    height: scale(200),
  },
  noTabIcon: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
  },
  noTabText: {
    fontSize: scale(14),
    color: '#848484',
    marginTop: scale(10),
  },
  inquiryContainer: {
    padding: scale(16),
    width: screenWidth,
    height: scale(200),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inquiryTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#202020',
  },
  inquiryDesc: {
    fontSize: scale(14),
    color: '#848484',
    marginTop: scale(10),
    textAlign: 'center',
  },
  inquiryButtonContainer: {
    marginTop: scale(20),
  },
  inquiryButton: {
    backgroundColor: '#202020',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
  },
  inquiryButtonText: {
    fontSize: scale(14),
    color: '#FFFFFF',
  },
});

export default ShoppingDetail; 