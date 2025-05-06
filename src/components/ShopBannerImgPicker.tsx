import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Linking
} from 'react-native';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getBannerAppDetail } from '../api/services/bannerAppService';
import { supabase } from '../utils/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ShopBannerImgPickerProps {
  style?: object;
}

interface BannerItem {
  banner_app_id: number;
  banner_img_url: string;
  banner_link_url: string;
  file_path?: string;
  file_name?: string;
}

const ShopBannerImgPicker: React.FC<ShopBannerImgPickerProps> = ({ style }) => {
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [defaultBanners, setDefaultBanners] = useState<BannerItem[]>([]);

  // 기본 배너 URL 가져오기
  useEffect(() => {
    try {
      // 첫 번째 기본 배너
      const { data: data1 } = supabase.storage
        .from('banner')
        .getPublicUrl('banner/shopping_banner_basic_001.jpg');
      
      // // 두 번째 기본 배너
      // const { data: data2 } = supabase.storage
      //   .from('banner')
      //   .getPublicUrl('banner/shopping_banner_basic_002.jpg');
      
      const defaultBannerList: BannerItem[] = [];
      
      if (data1 && data1.publicUrl) {
        defaultBannerList.push({
          banner_app_id: 9001,
          banner_img_url: data1.publicUrl,
          banner_link_url: ''
        });
      }
      
      // if (data2 && data2.publicUrl) {
      //   defaultBannerList.push({
      //     banner_app_id: 9002,
      //     banner_img_url: data2.publicUrl,
      //     banner_link_url: ''
      //   });
      // }
      
      setDefaultBanners(defaultBannerList);
    } catch (err) {
      console.error('기본 배너 URL 생성 중 오류:', err);
    }
  }, []);

  // 자동 슬라이드 기능
  useEffect(() => {
    // 표시할 배너가 있는 경우 (API 배너 또는 기본 배너)
    const displayBanners = banners.length > 0 ? banners : defaultBanners;
    
    if (displayBanners.length > 1) {
      const slideTimer = setInterval(() => {
        setCurrentIndex(prevIndex => 
          prevIndex === displayBanners.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // 5초마다 슬라이드
      
      return () => clearInterval(slideTimer);
    }
  }, [banners.length, defaultBanners.length]);

  // 배너 이미지 로드
  useEffect(() => {
    // 이미 배너가 로드되어 있고 로딩 중이 아니면 다시 로드하지 않음
    if (banners.length > 0 && !loading) {
      return;
    }
    
    const loadBanners = async () => {
      // 이미 로딩 중이면 중복 요청 방지
      if (loading) return;
      
      try {
        setLoading(true);
        
        const response = await getBannerAppDetail({
          banner_locate: "SHOP"
        });
        
        if (response.success && response.data) {
          
          // URL 처리하여 배너 목록 설정
          const processedBanners = response.data.map(banner => {
            // file_path와 file_name으로 이미지 경로 생성
            let imageUrl = '';
            
            if (banner.file_path && banner.file_name) {
              // file_path와 file_name 조합
              const imagePath = `${banner.file_path}/${banner.file_name}`.replace(/^\//, '');
              
              try {
                const { data } = supabase.storage
                  .from('banner')
                  .getPublicUrl(imagePath);
                  
                if (data && data.publicUrl) {
                  imageUrl = data.publicUrl;
                }
              } catch (err) {
                console.error('Supabase URL 생성 중 오류:', err);
              }
            } else if (banner.banner_img_url) {
              // 기존 banner_img_url이 있는 경우
              imageUrl = banner.banner_img_url;
              
              // 경로만 있는 경우 Supabase URL로 변환
              if (imageUrl && !imageUrl.includes('http')) {
                try {
                  const { data } = supabase.storage
                    .from('banner')
                    .getPublicUrl(imageUrl);
                    
                  if (data && data.publicUrl) {
                    imageUrl = data.publicUrl;
                  }
                } catch (err) {
                  console.error('Supabase URL 생성 중 오류:', err);
                }
              }
            } else {
            }
            
            const processedBanner = {
              ...banner,
              banner_img_url: imageUrl
            };
            
            return processedBanner;
          });
          
          const filteredBanners = processedBanners.filter(b => b.banner_img_url);
          setBanners(filteredBanners);
        } else {
          setBanners([]);
        }
      } catch (error) {
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadBanners();
  }, []);

  // 배너 클릭 핸들러
  const handleBannerPress = (banner: BannerItem) => {
    if (banner.banner_link_url) {
      Linking.openURL(banner.banner_link_url).catch(err => 
        console.error('배너 링크를 열 수 없습니다:', err)
      );
    }
  };

  // 페이지 인디케이터 렌더링 함수 (1 / 2 > 형식)
  const renderPageIndicator = (totalBanners: number) => {
    // 다음 배너로 이동하는 함수
    const goToNextBanner = () => {
      setCurrentIndex(prevIndex => 
        prevIndex === totalBanners - 1 ? 0 : prevIndex + 1
      );
    };
    
    return (
      <TouchableOpacity 
        style={styles.pageIndicatorContainer}
        onPress={goToNextBanner}
      >
        <Text style={styles.pageIndicatorText}>
          {currentIndex + 1} / {totalBanners} 
        </Text>
        <Image source={IMAGES.icons.triangleRightWhite} style={styles.arrowIcon} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6BC46A" />
        </View>
      ) : banners.length > 0 && currentIndex >= 0 && currentIndex < banners.length ? (
        <View>
          <TouchableOpacity
            onPress={() => handleBannerPress(banners[currentIndex])}
          >
            {banners[currentIndex].banner_img_url ? (
              <Image 
                source={{ uri: banners[currentIndex].banner_img_url }}
                style={styles.shopBannerImage}
                resizeMode="contain"
                onError={(e) => {
                  console.error('배너 이미지 로드 오류:', e.nativeEvent.error);
                  console.log('문제가 있는 이미지 URL:', banners[currentIndex].banner_img_url);
                }}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>이미지를 불러올 수 없습니다</Text>
              </View>
            )}
          </TouchableOpacity>
          {renderPageIndicator(banners.length)}
        </View>
      ) : defaultBanners.length > 0 ? (
        // 배너가 없을 때 기본 이미지 슬라이드를 보여줌
        <View>
          <TouchableOpacity>
            <Image 
              source={{ uri: defaultBanners[currentIndex].banner_img_url }}
              style={styles.shopBannerImage}
              resizeMode="contain"
              onError={(e) => {
                console.error('기본 배너 이미지 로드 오류:', e.nativeEvent.error);
              }}
            />
          </TouchableOpacity>
          {renderPageIndicator(defaultBanners.length)}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: scale(190),
    backgroundColor: '#EEEEEE',
    marginTop: scale(15),
    overflow: 'hidden',
  },
  shopBannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  pageIndicatorContainer: {
    position: 'absolute',
    bottom: scale(10),
    right: scale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: scale(15),
    paddingVertical: scale(5),
    width: scale(50),
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageIndicatorText: {
    color: '#FFFFFF',
    fontSize: scale(10),
    fontWeight: '500',
  },
  arrowIcon: {
    width: scale(7),
    height: scale(7),
    marginLeft: scale(3),
    resizeMode: 'contain',
  },
  errorContainer: {
    width: '100%',
    height: scale(150),
    backgroundColor: '#555555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    textAlign: 'center',
  },
  loadingContainer: {
    width: '100%',
    height: scale(150),
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShopBannerImgPicker; 