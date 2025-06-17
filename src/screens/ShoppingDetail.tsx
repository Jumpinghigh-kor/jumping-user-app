import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Animated,
  TextInput,
  ToastAndroid
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getProductAppImgDetail, getProductDetailAppList } from '../api/services/productAppService';
import { getMemberReviewAppList } from '../api/services/memberReviewAppService';
import { updateMemberZzimApp, getMemberZzimAppDetail, insertMemberZzimApp } from '../api/services/memberZzimAppService';
import { supabase } from '../utils/supabaseClient';
import { useProfileImage } from '../hooks/useProfileImage';
import ProfileImagePicker from '../components/ProfileImagePicker';
import ShoppingReview from '../components/ShoppingReview';
import { useAppSelector } from '../store/hooks';
import CustomPurchaseModal from '../components/CustomPurchaseModal';
import { commonStyle, layoutStyle } from '../styles/common';
import { createModalPanResponder } from '../utils/commonFunction';
import ReviewImgPicker from '../components/ReviewImgPicker';
import Clipboard from '@react-native-clipboard/clipboard';
import { getCouponAppList, insertMemberCouponApp, getMemberCouponAppList } from '../api/services/memberCouponApp';
import CouponListItem from '../components/CouponListItem';
import CustomToast from '../components/CustomToast';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 리뷰 아이템 컴포넌트
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
      
      {review.admin_del_yn === 'Y' ? (
        <View>
          <Text style={[styles.reviewText, {color: '#848484', fontSize: scale(12)}]}>관리자에 의해 삭제된 댓글입니다.</Text>
        </View>
      ) : (
        <>
          {review.review_app_id && (
            <View style={styles.reviewImageContainer}>
              <ReviewImgPicker
                maxImages={3}
                onImagesSelected={() => {}}
                memberId={review.mem_id}
                reviewAppId={review.review_app_id}
                disabled={true}
                hideTitle={true}
                />
            </View>
          )}
          <Text style={styles.reviewTitle}>{review.title}</Text>
          <Text style={styles.reviewText}>{review.content}</Text>
        </>
      )
    }
    </View>
  );
};

const ShoppingDetail = ({route, navigation}) => {
  const { product } = route.params;
  
  // 상태 관리
  const [productImages, setProductImages] = useState([]);
  const [detailImages, setDetailImages] = useState([]);
  const [reviewData, setReviewData] = useState([]);
  const [avgStarPoint, setAvgStarPoint] = useState(product.rating || "0");
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'review', 'inquiry'
  const [isWished, setIsWished] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(400);
  const [zzimData, setZzimData] = useState(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState('new');
  const [showPhotoReviewOnly, setShowPhotoReviewOnly] = useState(false);
  const [showMoreDetailImages, setShowMoreDetailImages] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [couponData, setCouponData] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [memberCouponData, setMemberCouponData] = useState([]);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState('');
  
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const scrollViewRef = useRef(null);
  const sortModalPan = useRef(new Animated.ValueXY()).current;
  const couponModalPan = useRef(new Animated.ValueXY()).current;

  // 정렬 모달 PanResponder
  const sortModalPanResponder = useMemo(() => 
    createModalPanResponder(sortModalPan, () => setShowSortModal(false)), 
    [sortModalPan]
  );

  // 쿠폰 모달 PanResponder
  const couponModalPanResponder = useMemo(() => 
    createModalPanResponder(couponModalPan, () => setShowCouponModal(false)), 
    [couponModalPan]
  );

  // pan 애니메이션 초기화
  useEffect(() => {
    if (showSortModal) {
      sortModalPan.setValue({ x: 0, y: 0 });
    }
  }, [showSortModal, sortModalPan]);

  useEffect(() => {
    if (showCouponModal) {
      couponModalPan.setValue({ x: 0, y: 0 });
    }
  }, [showCouponModal, couponModalPan]);

  // Supabase 이미지 URL 생성 함수
  const getSupabaseImageUrl = (imageData) => {
    if (!imageData) return product.image;
    
    // file_path와 file_name으로 이미지 경로 생성
    if (imageData.file_path && imageData.file_name) {
      const imagePath = `${imageData.file_path}/${imageData.file_name}`.replace(/^\//, '');
      const { data } = supabase.storage.from('product').getPublicUrl(imagePath);
      if (data?.publicUrl) return data.publicUrl;
    }
    
    // image_url이 있는 경우
    if (imageData.image_url) {
      if (!imageData.image_url.includes('http')) {
        const { data } = supabase.storage.from('product').getPublicUrl(imageData.image_url);
        if (data?.publicUrl) return data.publicUrl;
      }
      return imageData.image_url;
    }
    
    return product.image;
  };

  // 상품 이미지 로드
  const fetchProductImages = async () => {
    try {
      const response = await getProductAppImgDetail({
        product_app_id: product.product_app_id
      });
      
      if (response.success) {
        const imageArray = Array.isArray(response.data) ? response.data : [];
        const validImages = imageArray.filter(img => img != null);
        
        // 대표 이미지 필터링
        const representerImages = validImages.filter((img: any) => 
          ['REPRESENTER'].includes(img.img_form || img.image_form || img.form)
        );
        
        // 상세 이미지 필터링
        const detailImageList = validImages.filter((img: any) => 
          ['DETAIL'].includes(img.img_form || img.image_form || img.form)
        );

        // 대표 이미지 설정
        if (representerImages.length > 0) {
          setProductImages(representerImages);
        } else if (validImages.length > 0) {
          setProductImages(validImages);
        } else {
          setProductImages([{ image_url: product.image }]);
        }
        
        setDetailImages(detailImageList);
      }
    } catch (error) {
      setProductImages([{ image_url: product.image }]);
    } finally {
      setLoading(false);
    }
  };
  
  // 리뷰 데이터 로드
  const loadReviews = async () => {
    try {
      const response = await getMemberReviewAppList({
        product_app_id: product.product_app_id,
        filter: selectedSort,
        review_img_yn: showPhotoReviewOnly ? 'Y' : 'N'
      });
      
      if (response.success && response.data) {
        // 평균 별점 계산
        const starPoints = response.data.map(review => review.star_point).filter(Boolean);
        if (starPoints.length > 0) {
          const average = starPoints.reduce((sum, point) => sum + point, 0) / starPoints.length;
          setAvgStarPoint(average.toFixed(1));
        }
        
        setReviewData(response.data);
      }
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
    }
  };

  // 초기 찜 상태 확인
  const checkWishStatus = async () => {
    try {
      if (memberInfo?.mem_id) {
        const response = await getMemberZzimAppDetail({
          mem_id: memberInfo.mem_id,
          product_app_id: product.product_app_id
        });
        
        if (response.success && response.data) {
          setIsWished(response.data.zzim_yn === 'Y');
          setZzimData(response.data);
        }
      }
    } catch (error) {
      console.error('찜 상태 확인 실패:', error);
    }
  };

  // 쿠폰 데이터 로드
  const loadCouponData = async () => {
    try {
      const response = await getCouponAppList(product.product_app_id);
      console.log('쿠폰 데이터:', response);
      
      if (response.success && response.data) {
        setCouponData(response.data);
      }
    } catch (error: any) {
      console.error('쿠폰 데이터 로드 실패:', error.response.data);
    }
  };

  // 쿠폰 발급 여부 확인
  const isCouponIssued = (couponAppId) => {
    return memberCouponData.some(memberCoupon => memberCoupon.coupon_app_id === couponAppId);
  };

  // 쿠폰 다운로드 핸들러
  const handleDownloadCoupon = async (coupon) => {
    try {
      const response = await insertMemberCouponApp({
        mem_id: memberInfo?.mem_id,
        coupon_app_id: coupon.coupon_app_id
      });
      
      if (response.success) {
        loadMemberCouponList();
      } else {
        Alert.alert('실패', '쿠폰 발급에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('쿠폰 발급 실패:', error);
      Alert.alert('오류', '쿠폰 발급 중 오류가 발생했습니다.');
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchProductImages();
    loadReviews();
    loadCouponData();
  }, [product.product_app_id]);

  // 멤버 정보가 로드된 후 멤버 쿠폰 리스트 로드
  useEffect(() => {
    if (memberInfo?.mem_id) {
      loadMemberCouponList();
    }
  }, [memberInfo?.mem_id]);

  // selectedSort 변경 시 리뷰 데이터 재로드
  useEffect(() => {
    if (activeTab === 'review') {
      loadReviews();
    }
  }, [selectedSort, showPhotoReviewOnly]);

  useEffect(() => {
    checkWishStatus();
  }, [memberInfo?.mem_id]);

  // 장바구니 버튼 핸들러
  const handleCartPress = () => {
    navigation.navigate('ShoppingCart');
  };

  // 인디케이터 점 렌더링
  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {productImages.map((_, index) => (
        <View 
          key={index} 
          style={[styles.dot, index === activeSlide && styles.activeDot]} 
        />
      ))}
    </View>
  );

  // 이미지 슬라이더 아이템 렌더링
  const renderSliderItem = ({ item, index }) => {
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
  const handleSliderScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    
    if (newIndex !== activeSlide) {
      setActiveSlide(newIndex);
    }
  };

  // 탭 전환 핸들러
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    
    // 리뷰 탭 선택 시 데이터 로드
    if (tab === 'review' && reviewData.length === 0) {
      loadReviews();
    }
  };
  
  // WebView 높이 조정 핸들러
  const handleWebViewMessage = (event) => {
    const height = parseInt(event.nativeEvent.data);
    if (height > 0) {
      setWebViewHeight(height);
    }
  };
  
  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <View>
            {detailImages.length > 0 ? (
              <View>
                <WebView
                  source={{
                    html: `
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body { margin: 0; padding: 0; }
                            img { width: 100%; height: auto; display: block; margin-top: 20px; }
                            ::-webkit-scrollbar { display: none; }
                            body { -ms-overflow-style: none; scrollbar-width: none; }
                          </style>
                        </head>
                        <body>
                          ${detailImages.map((item, index) => 
                            `<img src="${getSupabaseImageUrl(item)}" alt="상품 이미지 ${index + 1}" />`
                          ).join('')}
                        </body>
                      </html>
                    `
                  }}
                  style={{ 
                    height: showMoreDetailImages ? (Platform.OS === 'ios' ? Math.max(webViewHeight, screenHeight) : webViewHeight) : scale(400), 
                    width: '100%' 
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scrollEnabled={showMoreDetailImages}
                  injectedJavaScript={`
                    setTimeout(function() {
                      window.ReactNativeWebView.postMessage(document.body.scrollHeight);
                    }, 500);
                  `}
                  onMessage={handleWebViewMessage}
                />
                
                {!showMoreDetailImages && (
                  <TouchableOpacity
                    style={styles.moreButtonContainer}
                    onPress={() => setShowMoreDetailImages(true)}
                  >
                    <Text style={styles.moreButtonText}>상세이미지 더보기</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noTabContainer}>
                <Image source={IMAGES.icons.sadFaceGray} style={styles.noTabIcon} />
                <Text style={styles.noTabText}>상품 상세 이미지가 없어요</Text>
              </View>
            )}

            <View style={styles.guideContainer}>
              <Text style={styles.guideTitle}>반품 / 교환 안내</Text>
              <View style={styles.guideHeader}>
                <Text style={styles.guideHeaderTitle}>신청기준일</Text>
                <Text style={styles.guideHeaderDesc}>상품 수령 후 7일 이내(단, 제품이 표시광고 내용과 다르거나 불량 등 계약과 다르게 이행된 경우는 제품수령일로부터 3개월이내나 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내 교환/반품이 가능)</Text>
              </View>
              <View style={styles.guideBody}>
                <View style={styles.guideBodyItem}>
                  <View style={[styles.guideBodyItemTitleCont, {height: scale(30)}]}>
                    <Text style={[styles.guideBodyItemTitle]}>받는 이</Text>
                  </View>
                  <View style={[styles.guideBodyItemDescCont, {height: scale(30)}]}>
                    <Text style={[styles.guideBodyItemDesc]}>(주)점핑하이</Text>
                  </View>
                </View>
                <View style={styles.guideBodyItem}>
                  <View style={[styles.guideBodyItemTitleCont, {height: scale(50)}]}>
                    <Text style={[styles.guideBodyItemTitle]}>주소</Text>
                  </View>
                  <View style={[styles.guideBodyItemDescCont, {height: scale(50)}]}>
                    <Text style={[styles.guideBodyItemDesc]}>(07798) 서울특별시 강서구 마곡서로 133{'\n'}704동 2층</Text>
                  </View>
                </View>
                <View style={styles.guideBodyItem}>
                  <View style={[styles.guideBodyItemTitleCont, {height: scale(50)}]}>
                    <Text style={[styles.guideBodyItemTitle]}>반품 교환처</Text>
                  </View>
                  <View style={[styles.guideBodyItemDescCont, {height: scale(50)}]}>
                    <Text style={[styles.guideBodyItemDesc]}>주소 및 전화번호 확인{'\n'}교환비 체크/상품하자, 오배송의 경우 무료 표기</Text>
                  </View>
                </View>
                <View style={styles.guideBodyItem}>
                  <View style={[styles.guideBodyItemTitleCont, {height: scale(275)}]}>
                    <Text style={styles.guideBodyItemTitle}>반품 교환처</Text>
                  </View>
                  <View style={[styles.guideBodyItemDescCont, {height: scale(275)}]}>
                    <Text style={[styles.guideBodyItemDesc, {paddingVertical: scale(10)}]}>
                      <Text style={{fontWeight: '600'}}>다음과 같은 경우 교환 및 반품 처리가 불가합니다.{'\n'}{'\n'}</Text>
                      <Text>- 상품을 이미 사용한 경우{'\n'}{'\n'}</Text>
                      <Text>- 상품 수령일로부터 7일이 경과한 경우{'\n'}{'\n'}</Text>
                      <Text>- 상품과 상품 액세서리를 분실 또는 훼손한 경우{'\n'}{'\n'}</Text>
                      <Text>- 이벤트 등으로 제공된 사은품을 사용하였거나 분실 또는 훼손한 경우{'\n'}{'\n'}</Text>
                      <Text>- 기타'전자상거래 등에서의 소비자 {'\n'}보호에 관한 법률'이 정하는 소비자 청약철회 제한에 해당하는 경우</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      case 'review':
        return (
          <View>
            <View style={[layoutStyle.rowBetween, {paddingVertical: scale(10)}]}>
              <View style={[layoutStyle.rowCenter]}>
                <TouchableOpacity 
                  style={[commonStyle.mr5]}
                  onPress={() => setShowPhotoReviewOnly(!showPhotoReviewOnly)}
                >
                  <Image 
                    source={showPhotoReviewOnly ? IMAGES.icons.checkboxGreen : IMAGES.icons.checkboxGray} 
                    style={{width: scale(16), height: scale(16), resizeMode: 'contain'}} 
                  />
                </TouchableOpacity>
                <Text style={{fontSize: scale(12), color: '#202020'}}>사진 리뷰만 보기({reviewData.filter(review => review.review_img_count > 0).length})</Text>
              </View>
              <View style={[layoutStyle.rowCenter]}>
                <TouchableOpacity 
                  style={[layoutStyle.rowCenter, {gap: scale(5)}]}
                  onPress={() => setShowSortModal(true)}
                >
                  <Image source={IMAGES.icons.filterGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
                  <Text style={{fontSize: scale(12), color: '#202020'}}>{selectedSort === 'new' ? '최신순' : selectedSort === 'high_star' ? '별점높은순' : '별점낮은순'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {(() => {
              const filteredReviews = showPhotoReviewOnly 
                ? reviewData.filter(review => review.review_img_count > 0) 
                : reviewData;
              
              return filteredReviews.length > 0 ? (
                filteredReviews.map((review, index) => (
                  <ReviewItem key={`review_${index}`} review={review} />
                ))
              ) : (
                <View style={styles.noTabContainer}>
                  <Image source={IMAGES.icons.speechGray} style={styles.noTabIcon} />
                  <Text style={styles.noTabText}>작성된 리뷰가 없어요</Text>
                </View>
              );
            })()}
          </View>
        );
      case 'inquiry':
        return (
          <>
            <View style={styles.inquiryContainer}>
              <Text style={styles.inquiryTitle}>이 상품에 대해{'\n'}궁금한 점이 있으신가요?</Text>
              <View style={styles.inquiryInputContainer}>
                <TextInput
                  style={styles.inquiryInput}
                  placeholder="문의 내용을 적어주세요"
                  placeholderTextColor="#848484"
                  multiline={true}
                  numberOfLines={4}
                  value={inquiryText}
                  onChangeText={setInquiryText}
                  maxLength={3000}
                />
                <TouchableOpacity style={styles.inquiryInputButton}>
                  <Text style={styles.inquiryInputButtonText}>입력완료</Text>
                </TouchableOpacity>
                <Text style={styles.inquiryInputCount}>
                  <Text style={{color: '#4C78ED'}}>{inquiryText.length} </Text>
                  / 3000
                </Text>
              </View>
              <Text style={styles.inquiryDesc}>
                여러분의 문의는 더 나은 서비스를 제공하기
                {'\n'}위한 소중한 자료가 됩니다.
                {'\n'}{'\n'}해당 의견에는 개별 답변은 드리지 않지만,
                {'\n'}서비스 개선을 위한 소중한 자료로 반영됩니다.
                {'\n'}{'\n'}함께 만들어가는 쇼핑 경험,
                {'\n'}작은 목소리도 크게 반영하겠습니다.
              </Text>
              <View style={styles.inquiryButtonContainer}>
                <TouchableOpacity style={styles.inquiryButton} onPress={() => {
                  // 실제 클립보드에 복사
                  Clipboard.setString('010-1234-5678');
                  
                  setCustomToastMessage('010-1234-5678가 복사되었습니다');
                  setShowCustomToast(true);
                }}>
                  <View style={styles.clickContainer}>
                    <Text style={styles.clickText}>click</Text>
                  </View>
                  <Text style={styles.inquiryButtonText}>010-1234-5678</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        );
      default:
        return null;
    }
  };
  
  // 구매 모달 열기/닫기
  const handlePurchaseClick = () => setShowPurchaseModal(true);
  const handleCloseModal = () => setShowPurchaseModal(false);
  
  // 찜하기 버튼 핸들러
  const handleWishButtonClick = async () => {
    try {
      const newWishState = !isWished;
      setIsWished(newWishState); // 즉시 UI 업데이트

      if (zzimData?.zzim_app_id) {
        // 기존 찜 데이터 업데이트
        const response = await updateMemberZzimApp({
          mem_id: memberInfo?.mem_id,
          zzim_yn: newWishState ? 'Y' : 'N',
          zzim_app_id: zzimData.zzim_app_id
        });
        
        if (response.success) {
          setZzimData({ ...zzimData, zzim_yn: newWishState ? 'Y' : 'N' });
        } else {
          setIsWished(!newWishState); // 실패시 되돌리기
        }
      } else {
        // 새로운 찜 데이터 생성
        const response = await insertMemberZzimApp({
          mem_id: memberInfo?.mem_id,
          product_app_id: product.product_app_id
        });
        
        if (response.success) {
          setZzimData({
            zzim_app_id: response.data.zzim_app_id,
            zzim_yn: 'Y',
            mem_id: memberInfo?.mem_id,
            product_app_id: product.product_app_id
          });
        } else {
          setIsWished(!newWishState); // 실패시 되돌리기
        }
      }
    } catch (error) {
      setIsWished(!isWished); // 에러시 되돌리기
      console.error('찜하기 처리 실패:', error);
    }
  };

  // 멤버 쿠폰 리스트 로드
  const loadMemberCouponList = async () => {
    try {
      const response = await getMemberCouponAppList({
        mem_id: memberInfo?.mem_id
      });
      
      if (response.success && response.data) {
        console.log('멤버 쿠폰 리스트:', response.data);
        setMemberCouponData(response.data);
      }
    } catch (error: any) {
      console.error('멤버 쿠폰 리스트 로드 실패:', error.response.data);
    }
  };

  return (
    <>
      <CommonHeader 
        title=""
        backIcon={IMAGES.icons.arrowLeftBlack}
        rightIcon={
          <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
            <Image source={IMAGES.icons.cartStrokeBlack} style={styles.cartIcon} />
          </TouchableOpacity>}
        backgroundColor="#FFFFFF"
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: scale(80)}}
        >
          {/* 상품 이미지 슬라이더 */}
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
                  renderItem={renderSliderItem}
                  keyExtractor={(item, index) => `slide_${index}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleSliderScroll}
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
          
          {/* 상품 정보 */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.title}</Text>
            
            {/* 리뷰 정보 */}
            {reviewData?.length > 0 ? (
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
            
            {/* 가격 정보 */}
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                {product.discount > 0 && (
                  <View style={styles.discountContainer}>
                    <Text style={styles.discount}>{product.discount}%</Text>
                    <Text style={styles.originalPrice}>{product.original_price}원</Text>
                  </View>
                )}
              </View>
              <View style={[layoutStyle.rowBetween]}>
                <Text style={styles.price}>{product.price}원</Text>
                <View>
                  <TouchableOpacity
                    style={[commonStyle.pv10, layoutStyle.rowStart, {borderWidth: 1, borderColor: '#5588FF', borderRadius: scale(8), paddingHorizontal: scale(5), paddingVertical: scale(5)}]}
                    onPress={() => setShowCouponModal(true)}
                  >
                    <Text style={{fontSize: scale(12), color: '#5588FF'}}>쿠폰 받기</Text>
                    <Image source={IMAGES.icons.downloadBlue} style={{width: scale(12), height: scale(12), resizeMode: 'contain', marginLeft: scale(5)}} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={{marginTop: scale(10), marginBottom: scale(25), borderBottomWidth: 1, borderBottomColor: '#EEEEEE', marginHorizontal: -scale(20)}} />
            
            {/* 배송 정보 */}
            <View style={styles.deliveryContainer}>
              <Text style={styles.deliveryTitle}>배송</Text>
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.deliveryText}>무료배송</Text>
                  <Image source={IMAGES.icons.infoGray} style={styles.deliveryInfoIcon} />
                </View>
                <Text style={styles.deliveryDate}>
                  <Text style={{fontWeight: '600'}}>04.08(화)</Text> 이내 판매자 발송예정
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            {/* 탭 메뉴 */}
            <View style={styles.tabContainer}>
              {['info', 'review', 'inquiry'].map((tab) => (
                <TouchableOpacity 
                  key={tab}
                  style={styles.tabButton} 
                  onPress={() => handleTabPress(tab)}
                >
                  <Text style={[
                    styles.tabButtonText, 
                    activeTab === tab && styles.activeTabButtonText
                  ]}>
                    {tab === 'info' ? '상품정보' : tab === 'review' ? '리뷰' : '문의'}
                  </Text>
                  {activeTab === tab && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>
              ))}
            </View>
            
            {/* 탭 컨텐츠 */}
            {renderTabContent()}
          </View>
        </ScrollView>
        
        {/* 하단 구매/찜 버튼 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.wishButton} 
            onPress={handleWishButtonClick}
          >
            <Icon 
              name={isWished ? "heart" : "heart-outline"} 
              size={24} 
              color={isWished ? "#F04D4D" : "#202020"} 
            />
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

        {/* 정렬 모달 */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSortModal(false)}
        >
          <View style={styles.sortModalOverlay}>
            <Animated.View
              style={[
                styles.sortModalContent,
                {
                  transform: [{ translateY: sortModalPan.y }]
                }
              ]}
            >
              <View
                {...sortModalPanResponder.panHandlers}
                style={styles.dragArea}
              >
                <Image source={IMAGES.icons.smallBarGray} style={styles.modalBar} />
              </View>
              
              <TouchableOpacity 
                style={styles.sortOption}
                onPress={() => {
                  setSelectedSort('new');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>최신순</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sortOption}
                onPress={() => {
                  setSelectedSort('high_star');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>별점높은순</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sortOption}
                onPress={() => {
                  setSelectedSort('low_star');
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.sortOptionText}>별점낮은순</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* 쿠폰 모달 */}
        <Modal
          visible={showCouponModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCouponModal(false)}
        >
          <View style={styles.sortModalOverlay}>
            <Animated.View
              style={[
                styles.sortModalContent,
                {
                  transform: [{ translateY: couponModalPan.y }]
                }
              ]}
            >
              <View
                {...couponModalPanResponder.panHandlers}
                style={styles.dragArea}
              >
                <Image source={IMAGES.icons.smallBarGray} style={styles.modalBar} />
              </View>
              
              <ScrollView
                showsVerticalScrollIndicator={false}
              >
                {couponData && couponData.length > 0 ? (
                  couponData.map((coupon, index) => (
                    <CouponListItem
                      key={index}
                      coupon={coupon}
                      index={index}
                      showDownloadButton={true}
                      onDownload={handleDownloadCoupon}
                      isIssued={isCouponIssued(coupon.coupon_app_id)}
                    />
                  ))
                ) : (
                  <View style={[styles.couponItemContainer, {borderWidth: 0, alignItems: 'center', justifyContent: 'center', padding: scale(16), paddingTop: scale(80)}]}>
                    <Text style={{fontSize: scale(14), fontWeight: '600', color: '#848484'}}>사용 가능한 쿠폰이 없어요</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* 커스텀 토스트 */}
        <CustomToast
          visible={showCustomToast}
          message={customToastMessage}
          onHide={() => setShowCustomToast(false)}
          position="bottom"
        />
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
    marginTop: scale(5),
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  inquiryTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#202020',
    marginTop: scale(16),
  },
  inquiryInputContainer: {
    position: 'relative',
    width: '100%',
  },
  inquiryInput: {
    height: scale(200),
    borderWidth: 1,
    borderColor: '#202020',
    borderRadius: scale(10),
    padding: scale(16),
    marginTop: scale(20),
    textAlignVertical: 'top',
  },
  inquiryInputButton: {
    position: 'absolute',
    bottom: scale(35),
    left: '50%',
    transform: [{ translateX: -scale(30) }],
    backgroundColor: '#000000',
    padding: scale(10),
    borderRadius: scale(10),
  },
  inquiryInputButtonText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inquiryInputCount: {
    fontSize: scale(12),
    color: '#717171',
    marginTop: scale(5),
    marginRight: scale(10),
    textAlign: 'right',
  },
  inquiryDesc: {
    fontSize: scale(14),
    color: '#202020',
    marginTop: scale(30),
    textAlign: 'center',
  },
  inquiryButtonContainer: {
    marginTop: scale(40),
  },
  inquiryButton: {
    backgroundColor: '#202020',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    paddingVertical: scale(1),
    width: scale(38),
    marginBottom: scale(5),
  },
  clickText: {
    fontSize: scale(12),
    color: '#000000',
    textAlign: 'center',
  },
  inquiryButtonText: {
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    width: '100%',
    maxHeight: '50%',
    minHeight: '50%',
    padding: scale(20),
  },
  dragArea: {
    width: '100%',
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -scale(10),
    marginBottom: scale(5),
  },
  modalBar: {
    width: scale(40),
    height: scale(30),
    resizeMode: 'contain',
  },
  sortOption: {
    padding: scale(15),
  },
  sortOptionText: {
    fontSize: scale(16),
    color: '#202020',
    textAlign: 'center',
  },
  couponItemContainer: {
    borderWidth: 1,
    borderColor: '#43B546',
    borderRadius: scale(10),
    marginBottom: scale(20),
  },
  reviewImageContainer: {
    marginTop: scale(10),
  },
  guideContainer: {
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    paddingTop: scale(20),
    marginTop: scale(20),
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  guideTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#202020',
  },
  moreButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(16),
    backgroundColor: '#42B649',
  },
  moreButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: scale(5),
    textAlign: 'center',
  },
  guideHeader: {
    marginTop: scale(20),
  },
  guideHeaderTitle: {
    backgroundColor: '#EEEEEE',
    fontSize: scale(12),
    fontWeight: '500',
    color: '#202020',
    textAlign: 'center',
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  guideHeaderDesc: {
    fontSize: scale(12),
    color: '#202020',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: scale(16),
    marginTop: scale(4),
  },
  guideBody: {
    marginTop: scale(10),
  },
  guideBodyItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  guideBodyItemTitleCont: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: scale(7),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    width: '24%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBodyItemTitle: {
    fontSize: scale(12),
    fontWeight: '500',
    color: '#202020',
  },
  guideBodyItemDescCont: {
    paddingHorizontal: scale(7),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    width: '74%',
    marginLeft: '1%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  guideBodyItemDesc: {
    fontSize: scale(12),
    color: '#202020',
  },
});

export default ShoppingDetail; 