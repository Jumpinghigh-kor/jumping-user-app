import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ToastAndroid,
  Keyboard
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getProductAppImgDetail, getProductDetailAppList, getTargetProductDetailApp } from '../api/services/productAppService';
import { getMemberReviewAppList } from '../api/services/memberReviewAppService';
import { updateMemberZzimApp, getMemberZzimAppDetail, insertMemberZzimApp } from '../api/services/memberZzimAppService';
import { supabase } from '../utils/supabaseClient';
import { useProfileImage } from '../hooks/useProfileImage';
import ProfileImagePicker from '../components/ProfileImagePicker';
import ShoppingReview from '../components/ShoppingReview';
import { useAppSelector } from '../store/hooks';
import CustomPurchaseModal from '../components/CustomPurchaseModal';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { createModalPanResponder } from '../utils/commonFunction';
import ReviewImgPicker from '../components/ReviewImgPicker';
import Clipboard from '@react-native-clipboard/clipboard';
import { getCouponAppList, insertMemberCouponApp, getMemberCouponAppList } from '../api/services/memberCouponApp';
import { insertInquiryShoppingApp } from '../api/services/inquiryShoppingAppService';
import CouponListItem from '../components/CouponListItem';
import CommonPopup from '../components/CommonPopup';
import CustomToast from '../components/CustomToast';
import { useAuth } from '../hooks/useAuth';
import { getReturnExchangePolicyList } from '../api/services/returnExchangePolicyService';

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
            <Text style={[styles.reviewerName, {color: review?.mem_app_status === 'EXIT' ? '#848484' : '#000000'}]}>{review?.mem_app_status === 'EXIT' ? '탈퇴한 회원' : review.mem_nickname}</Text>
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
          <Text style={[styles.reviewText, {color: '#848484', fontSize: scale(12), fontFamily: 'Pretendard-Medium'}]}>관리자에 의해 삭제된 댓글입니다.</Text>
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
                route={'ShoppingDetail'}
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
  const { productParams } = route.params;
  const { loadMemberInfo } = useAuth();
  
  // 상태 관리
  const [productImages, setProductImages] = useState([]);
  const [detailImages, setDetailImages] = useState([]);
  const [reviewData, setReviewData] = useState([]);
  const [avgStarPoint, setAvgStarPoint] = useState("0");
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
  const [androidKeyboardVisible, setAndroidKeyboardVisible] = useState(false);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const [couponData, setCouponData] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [memberCouponData, setMemberCouponData] = useState([]);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState('');
  const [showInquiryPopup, setShowInquiryPopup] = useState(false);
  const [productDetailData, setProductDetailData] = useState([]);
  const [returnExchangePolicy, setReturnExchangePolicy] = useState([]);
  const [inquiryError, setInquiryError] = useState('');
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const scrollViewRef = useRef(null);
  const pageScrollRef = useRef<ScrollView | null>(null);
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

  // 상품 상세 데이터 가져오기
  const fetchTargetProductDetailData = async () => {
    try {
      const response = await getTargetProductDetailApp({
        product_app_id: productParams.product_app_id
      });
      
      if (response.success && response.data) {
        setProductDetailData(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (error) {
      
    }
  };

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
    if (!imageData) return productParams.image;
    
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
    
    return productParams.image;
  };

  // 상품 이미지 로드
  const fetchProductImages = async () => {
    try {
      const response = await getProductAppImgDetail({
        product_app_id: productParams.product_app_id
      });
      
      if (response.success) {
        const imageArray = Array.isArray(response.data) ? response.data : [];
        const validImages = imageArray.filter(img => img != null);
        const getOrder = (img: any) => {
          try {
            const raw = (img?.order_seq ?? img?.img_order ?? img?.order ?? img?.sort_order ?? img?.sequence ?? 0);
            const n = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
            return isNaN(n) ? 0 : n;
          } catch {
            return 0;
          }
        };
        const sortByOrder = (arr: any[]) => arr.slice().sort((a, b) => getOrder(a) - getOrder(b));
        
        // 대표 이미지 필터링
        const representerImages = sortByOrder(
          validImages.filter((img: any) => ['REPRESENTER'].includes(img.img_form || img.image_form || img.form))
        );
        
        // 상세 이미지 필터링
        const detailImageList = sortByOrder(
          validImages.filter((img: any) => ['DETAIL'].includes(img.img_form || img.image_form || img.form))
        );

        // 대표 이미지 설정
        if (representerImages.length > 0) {
          setProductImages(representerImages);
        } else if (validImages.length > 0) {
          setProductImages(sortByOrder(validImages));
        } else {
          setProductImages([{ image_url: productParams.image }]);
        }
        
        setDetailImages(detailImageList);
      }
    } catch (error) {
      setProductImages([{ image_url: productParams.image }]);
    } finally {
      setLoading(false);
    }
  };

  // 반품 교환 정책 로드
  const fetchReturnExchangePolicy = async () => {
    try {
      const response = await getReturnExchangePolicyList({
        product_app_id: productParams.product_app_id
      });
      
      if (response.success) {        
        setReturnExchangePolicy(response.data);
      }
    } catch (error) {
      setReturnExchangePolicy([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 리뷰 데이터 로드
  const loadReviews = async () => {
    try {
      const response = await getMemberReviewAppList({
        product_app_id: productParams.product_app_id,
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
      if (memberInfo?.mem_id && productParams?.product_app_id) {
        const response = await getMemberZzimAppDetail({
          mem_id: Number(memberInfo.mem_id),
          product_app_id: Number(productParams.product_app_id)
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
      const response = await getCouponAppList(productParams.product_app_id);
      
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

  // 화면이 포커스될 때마다 멤버 정보 새로고침
  useFocusEffect(
    useCallback(() => {
      loadMemberInfo();
    }, [])
  );

  // 초기 데이터 로드
  useEffect(() => {
    fetchProductImages();
    loadReviews();
    loadCouponData(); 
    fetchTargetProductDetailData();
    fetchReturnExchangePolicy();
  }, [productParams.product_app_id]);

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

  // 문의 탭으로 전환 시 화면 맨 아래로 스크롤
  useEffect(() => {
    if (activeTab === 'inquiry') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            pageScrollRef.current?.scrollToEnd({ animated: true });
          } catch {}
        }, 0);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    checkWishStatus();
  }, [memberInfo?.mem_id]);

  // Android: 키보드 표시 시 하단 구매 바가 따라 올라오지 않도록(키보드 높이만큼 역보정)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setAndroidKeyboardVisible(true);
      setAndroidKeyboardHeight(e?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardVisible(false);
      setAndroidKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 초기 전체 로딩 상태: 주요 데이터가 준비될 때까지 전체 로딩 화면 노출
  const pageLoading = loading || !(productDetailData && productDetailData.length > 0);

  // 장바구니 버튼 핸들러
  const handleCartPress = () => {
    navigation.navigate('ShoppingCart');
  };

  // 현재 날짜 기준 유효 쿠폰 존재 여부
  const hasActiveCoupon = useMemo(() => {
    if (!couponData || couponData.length === 0) return false;
    const toYmdNum = (dateObj: Date) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return Number(`${y}${m}${d}`);
    };
    const normalizeDateField = (val: any): number | null => {
      if (!val) return null;
      const digits = String(val).replace(/\D/g, '');
      if (digits.length < 8) return null;
      return Number(digits.slice(0, 8));
    };
    const now = toYmdNum(new Date());
    const isInRange = (c: any) => {
      const start = normalizeDateField(
        c.start_dt ?? c.start_date ?? c.issue_start_dt ?? c.valid_from ?? c.available_from
      );
      const end = normalizeDateField(
        c.end_dt ?? c.end_date ?? c.issue_end_dt ?? c.valid_to ?? c.available_to
      );
      // 기간 정보가 하나도 없으면 노출하지 않음
      if (!(start || end)) return false;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    };
    return couponData.some(isInRange);
  }, [couponData]);

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
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover">
                          <style>
                            body { margin: 0; padding: 0; }
                            img { 
                              width: 100%; 
                              height: auto; 
                              display: block; 
                              margin-top: 20px;
                              -webkit-user-select: none;
                              -moz-user-select: none;
                              -ms-user-select: none;
                              user-select: none;
                              -webkit-touch-callout: none;
                              -webkit-user-drag: none;
                              -khtml-user-drag: none;
                              -moz-user-drag: none;
                              -o-user-drag: none;
                              user-drag: none;
                              pointer-events: none;
                            }
                            html, body { touch-action: manipulation; }
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
                    height: showMoreDetailImages ? Math.max(webViewHeight, screenHeight) : scale(400), 
                    width: '100%' 
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  originWhitelist={['*']}
                  mixedContentMode="always"
                  scrollEnabled={false}
                  injectedJavaScript={`
                    (function() {
                      // Disable pinch-zoom/gesture zoom
                      try {
                        var vp = document.querySelector('meta[name="viewport"]');
                        if (!vp) {
                          vp = document.createElement('meta');
                          vp.setAttribute('name', 'viewport');
                          document.head.appendChild(vp);
                        }
                        vp.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover');
                        document.addEventListener('gesturestart', function(e){ e.preventDefault(); }, { passive: false });
                        document.addEventListener('gesturechange', function(e){ e.preventDefault(); }, { passive: false });
                        document.addEventListener('gestureend', function(e){ e.preventDefault(); }, { passive: false });
                        document.addEventListener('touchmove', function(e){ if (e.scale && e.scale !== 1) { e.preventDefault(); } }, { passive: false });
                      } catch (e) {}

                      function sendHeight() {
                        try {
                          var h = Math.max(
                            document.body.scrollHeight || 0,
                            document.documentElement.scrollHeight || 0
                          );
                          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h));
                        } catch (e) {}
                      }
                      var lastH = 0;
                      function maybeSend() {
                        try {
                          var h = Math.max(
                            document.body.scrollHeight || 0,
                            document.documentElement.scrollHeight || 0
                          );
                          if (h !== lastH) {
                            lastH = h;
                            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h));
                          }
                        } catch (e) {}
                      }
                      // Initial
                      sendHeight();
                      // On window load
                      window.addEventListener('load', sendHeight);
                      // Images load
                      try {
                        Array.prototype.forEach.call(document.images || [], function(img) {
                          if (!img.complete) {
                            img.addEventListener('load', maybeSend);
                            img.addEventListener('error', maybeSend);
                          }
                        });
                      } catch (e) {}
                      // Mutation observer
                      try {
                        var mo = new MutationObserver(function() { setTimeout(maybeSend, 50); });
                        mo.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
                      } catch (e) {}
                      // Periodic fallback
                      setInterval(maybeSend, 500);
                    })();
                  `}
                  onMessage={handleWebViewMessage}
                />
                
                {!showMoreDetailImages && (
                  <TouchableOpacity
                    style={styles.moreButtonContainer}
                    onPress={() => setShowMoreDetailImages(true)}
                  >
                    <Text style={[styles.moreButtonText, {fontFamily: 'Pretendard-Medium'}]}>상세이미지 더보기</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noTabContainer}>
                <Image source={IMAGES.icons.sadFaceGray} style={styles.noTabIcon} />
                <Text style={[styles.noTabText, {fontFamily: 'Pretendard-Medium'}]}>상품 상세 이미지가 없어요</Text>
              </View>
            )}

            <View style={styles.returnContainer}>
              <Text style={styles.returnTitle}>반품 / 교환 안내</Text>
              {returnExchangePolicy?.length > 0 && (
                returnExchangePolicy.map((item, index) => (
                  <View key={index}>
                    <View style={item?.direction === 'COLUMN' ? commonStyle.mb10 : styles.returnRowItem}>
                      <View style={item?.direction === 'COLUMN' ? '' : styles.returnRowItemTitleCont}>
                        <Text style={item?.direction === 'COLUMN' ? styles.returnColumnTitle : styles.returnRowItemTitle}>{item.title}</Text>
                      </View>
                      <View style={item?.direction === 'COLUMN' ? '' : styles.returnRowItemDescCont}>
                        <Text style={item?.direction === 'COLUMN' ? styles.returnColumnDesc : styles.returnRowItemDesc}>{item.content}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
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
                <Text style={{fontSize: scale(12), color: '#202020', fontFamily: 'Pretendard-Medium'}}>사진 리뷰만 보기({reviewData.filter(review => review.review_img_count > 0).length})</Text>
              </View>
              <View style={[layoutStyle.rowCenter]}>
                <TouchableOpacity 
                  style={[layoutStyle.rowCenter, {gap: scale(5)}]}
                  onPress={() => setShowSortModal(true)}
                >
                  <Image source={IMAGES.icons.filterGray} style={{width: scale(12), height: scale(12), resizeMode: 'contain'}} />
                  <Text style={{fontSize: scale(12), color: '#202020', fontFamily: 'Pretendard-Medium'}}>{selectedSort === 'new' ? '최신순' : selectedSort === 'high_star' ? '별점높은순' : '별점낮은순'}</Text>
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
                  <Text style={[styles.noTabText, {fontFamily: 'Pretendard-Medium'}]}>작성된 리뷰가 없어요</Text>
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
                  placeholder="소중한 의견을 적어주세요"
                  placeholderTextColor="#848484"
                  multiline={true}
                  numberOfLines={4}
                  value={inquiryText}
                  onChangeText={(t) => {
                    setInquiryText(t);
                    if (inquiryError && t.trim()) setInquiryError('');
                  }}
                  maxLength={3000}
                />
                <TouchableOpacity style={styles.inquiryInputButton} onPress={handleInquirySubmit}>
                  <Text style={styles.inquiryInputButtonText}>입력완료</Text>
                </TouchableOpacity>
                <View style={styles.inquiryFooterRow}>
                  <Text style={styles.inquiryErrorText}>{inquiryError}</Text>
                  <Text style={styles.inquiryInputCount}>
                    <Text style={{color: '#4C78ED'}}>{inquiryText.length} </Text>
                    / 3000
                  </Text>
                </View>
              </View>
              <Text style={styles.inquiryDesc}>
                위에 쓴 소중한 의견은 쇼핑몰 개선을 위해 사용됩니다.
                {'\n'}{'\n'}문의를 원하시면
                {'\n'}아래의&nbsp;
                <Text style={{ fontFamily: 'Pretendard-SemiBold' }}>
                  전화번호로 직접 문의
                </Text>
                해주세요.
              </Text>
              <View style={styles.inquiryButtonContainer}>
                <TouchableOpacity style={styles.inquiryButton} onPress={() => {
                  // 실제 클립보드에 복사
                  Clipboard.setString(productDetailData[0]?.inquiry_phone_number);
                  setCustomToastMessage(productDetailData[0]?.inquiry_phone_number + '가 복사되었습니다');
                  setShowCustomToast(true);
                }}>
                  <View style={styles.clickContainer}>
                    <Text style={styles.clickText}>click</Text>
                  </View>
                  <Text style={styles.inquiryButtonText}>{productDetailData[0]?.inquiry_phone_number}</Text>
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
  const handleCloseModal = () => {
    setShowPurchaseModal(false);
    // 모달이 닫힐 때 멤버 정보 새로고침
    loadMemberInfo();
  };

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
          product_app_id: productParams.product_app_id
        });
        
        if (response.success) {
          setZzimData({
            zzim_app_id: response.data.zzim_app_id,
            zzim_yn: 'Y',
            mem_id: memberInfo?.mem_id,
            product_app_id: productParams.product_app_id
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
        setMemberCouponData(response.data);
      }
    } catch (error: any) {
      console.error('멤버 쿠폰 리스트 로드 실패:', error.response.data);
    }
  };

  // 문의 제출 핸들러
  const handleInquirySubmit = async () => {
    try {
      if (!inquiryText.trim()) {
        setInquiryError('의견을 입력한 후 버튼을 눌러주세요');
        return;
      }

      const response = await insertInquiryShoppingApp({
        product_app_id: productParams.product_app_id,
        content: inquiryText,
        mem_id: memberInfo?.mem_id ? Number(memberInfo.mem_id) : undefined
      });

      if (response.success) {
        setCustomToastMessage('소중한 의견이 반영되었습니다.');
        setShowCustomToast(true);
        setInquiryText('');
      } else {
        setCustomToastMessage('데이터 전송이 실패하였습니다.');
        setShowCustomToast(true);
      }
    } catch (error: any) {
      try {
        console.error('등록 실패:', error?.response?.data?.message || error?.message || String(error));
      } catch {}
      setCustomToastMessage('데이터 전송이 실패하였습니다.');
      setShowCustomToast(true);
    }
  };

  if (pageLoading) {
    return (
      <>
        <CommonHeader 
          title=""
          backIcon={IMAGES.icons.arrowLeftBlack}
          backgroundColor="#FFFFFF"
        />
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#43B546" />
        </View>
      </>
    );
  }

  return (
    <>
      <CommonHeader 
        title=""
        backIcon={IMAGES.icons.arrowLeftBlack}
        rightIcon={
          <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
            <Image source={IMAGES.icons.cartStrokeBlack} style={styles.cartIcon} />
            {memberInfo?.cart_cnt && memberInfo.cart_cnt > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{memberInfo.cart_cnt}</Text>
              </View>
            )}
          </TouchableOpacity>}
        backgroundColor="#FFFFFF"
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          ref={pageScrollRef}
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
            <Text style={styles.productName}>{productDetailData[0]?.product_name}</Text>
            
            {/* 리뷰 정보 */}
            {reviewData?.length > 0 ? (
              <ShoppingReview 
                productAppId={productParams.product_app_id} 
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
                {parseFloat(avgStarPoint) > 0 ? <Text style={styles.rating}>{avgStarPoint}</Text> : null}
              </View>
            )}
            
            {/* 가격 정보 */}
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                {productDetailData[0]?.discount > 0 && (
                  <View style={styles.discountContainer}>
                    <Text style={styles.discount}>{productDetailData[0]?.discount}%</Text>
                    <Text style={styles.originalPrice}>{productDetailData[0]?.original_price.toLocaleString()}원</Text>
                  </View>
                )}
              </View>
              <View style={[layoutStyle.rowBetween]}>
                <Text style={styles.price}>{productDetailData[0]?.price.toLocaleString()}원</Text>
                <View>
                  {hasActiveCoupon && (
                    <TouchableOpacity
                      style={[commonStyle.pv10, layoutStyle.rowStart, {borderWidth: 1, borderColor: '#5588FF', borderRadius: scale(8), paddingHorizontal: scale(5), paddingVertical: scale(5)}]}
                      onPress={() => setShowCouponModal(true)}
                    >
                      <Text style={{fontSize: scale(12), color: '#5588FF', fontFamily: 'Pretendard-Regular'}}>쿠폰 받기</Text>
                      <Image source={IMAGES.icons.downloadBlue} style={{width: scale(12), height: scale(12), resizeMode: 'contain', marginLeft: scale(5)}} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
            
            <View style={{marginTop: scale(10), marginBottom: scale(25), borderBottomWidth: 1, borderBottomColor: '#EEEEEE', marginHorizontal: -scale(20)}} />
            
            {/* 배송 정보 */}
            <View style={styles.deliveryContainer}>
              <Text style={styles.deliveryTitle}>배송</Text>
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.deliveryText}>{productDetailData[0]?.delivery_fee}원</Text>
                  {(productDetailData[0]?.free_shipping_amount && productDetailData[0]?.free_shipping_amount !== "0") && <Text>({productDetailData[0]?.free_shipping_amount}원 이상 구매 시 무료배송)</Text>}
                </View>
                <View>
                  <Text style={{fontSize: scale(12), color: '#848484', fontFamily: 'Pretendard-Regular'}}>제주 및 도서지역 추가 {parseInt(productDetailData[0]?.remote_delivery_fee?.toString().replace(/,/g, '') || '0').toLocaleString()}원</Text>
                </View>
                <Text style={styles.deliveryDate}>
                  {productDetailData[0]?.today_send_yn === 'Y' ? (
                    <Text style={{fontWeight: '500'}}>오늘 {productDetailData[0]?.today_send_time}까지 결제 시 당일 발송</Text>
                  ) : (
                    <Text style={{fontWeight: '500'}}>{productDetailData[0]?.not_today_send_day}일 이내 발송예정</Text>
                  )}
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
        
        {/* 하단 구매/찜 버튼 (Android 키보드 시에도 고정: 키보드 높이만큼 역보정) */}
        <View style={[
          styles.bottomBar,
          Platform.OS === 'android' && androidKeyboardVisible ? { bottom: -androidKeyboardHeight } : null,
        ]}>
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
          product={productParams}
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
                    <Text style={{fontSize: scale(14), fontFamily: 'Pretendard-SemiBold', color: '#848484'}}>사용 가능한 쿠폰이 없어요</Text>
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

        {/* 문의 입력 알림 팝업 */}
        <CommonPopup
          visible={showInquiryPopup}
          title="알림"
          message="소중한 의견을 입력해주세요."
          type="warning"
          backgroundColor="#FFFFFF"
          textColor="#202020"
          onConfirm={() => setShowInquiryPopup(false)}
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
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: scale(10),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-SemiBold',
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
    alignItems: 'flex-end',
    position: 'relative',
  },
  cartIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  cartBadge: {
    position: 'absolute',
    top: scale(-5),
    right: scale(-5),
    backgroundColor: '#FF0000',
    borderRadius: scale(15),
    width: scale(13),
    height: scale(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: scale(8),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
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
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-Medium',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: scale(10),
  },
  reviewText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
  },
  reviewDate: {
    fontSize: scale(12),
    color: '#999',
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-SemiBold',
    marginTop: scale(10),
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  deliveryTitle: {
    fontSize: scale(14),
    marginRight: scale(10),
    color: '#848484',
    marginTop: scale(2),
  },
  deliveryText: {
    fontSize: scale(14),
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-Medium',
  },
  inquiryContainer: {
    padding: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inquiryTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    color: '#202020',
    marginTop: scale(16),
  },
  inquiryInputContainer: {
    position: 'relative',
    width: '100%',
  },
  inquiryInput: {
    height: scale(150),
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
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  inquiryInputCount: {
    fontSize: scale(12),
    color: '#717171',
    marginTop: scale(5),
    marginRight: scale(10),
    textAlign: 'right',
    fontFamily: 'Pretendard-Regular',
  },
  inquiryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(5),
  },
  inquiryErrorText: {
    color: '#F04D4D',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  inquiryDesc: {
    fontSize: scale(14),
    color: '#202020',
    marginTop: scale(30),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Regular',
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
  returnContainer: {
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    paddingTop: scale(20),
    marginTop: scale(20),
    marginHorizontal: -scale(16),
    paddingHorizontal: scale(16),
  },
  returnTitle: {
    fontSize: scale(18),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
    marginBottom: scale(10),
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
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginRight: scale(5),
    textAlign: 'center',
  },
  returnColumnTitle: {
    backgroundColor: '#EEEEEE',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    color: '#202020',
    textAlign: 'center',
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  returnColumnDesc: {
    fontSize: scale(12),
    color: '#202020',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: scale(16),
    marginTop: scale(4),
  },
  returnRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '2%',
  },
  returnRowItemTitleCont: {
    backgroundColor: '#EEEEEE',
    width: '24%',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingVertical: scale(5),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(10),
  },
  returnRowItemTitle: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    color: '#202020',
    textAlign: 'center',
  },
  returnRowItemDescCont: {
    width: '74%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
  },
  returnRowItemDesc: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
  },
});

export default ShoppingDetail; 