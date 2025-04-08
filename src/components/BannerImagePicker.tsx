import React, { useState, useEffect } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
  Linking
} from 'react-native';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getBannerAppDetail } from '../api/services/bannerAppService';
import { supabase } from '../utils/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';

interface BannerImagePickerProps {
  bannerLocate: string; // 'HOME', 'PROFILE' 등
  style?: object;
}

interface BannerItem {
  banner_app_id: number;
  banner_img_url: string;
  banner_link_url: string;
  file_path?: string;
  file_name?: string;
}

const { width } = Dimensions.get('window');

const BannerImagePicker: React.FC<BannerImagePickerProps> = ({ 
  bannerLocate,
  style
}) => {
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (banners.length > 1) {
      const slideTimer = setInterval(() => {
        setCurrentIndex(prevIndex => 
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000); // 3초마다 슬라이드
      
      return () => clearInterval(slideTimer);
    }
  }, [banners.length]);

  // 배너 이미지 로드
  useFocusEffect(
    React.useCallback(() => {
      // 이미 배너가 로드되어 있고 로딩 중이 아니면 다시 로드하지 않음
      if (banners.length > 0 && !loading) {
        return;
      }
      
      const loadBanners = async () => {
        // 이미 로딩 중이면 중복 요청 방지
        if (loading) return;
        
        try {
          setLoading(true);
          console.log('배너 로드 시작:', bannerLocate);
          
          const response = await getBannerAppDetail({
            banner_locate: bannerLocate
          });
          
          if (response.success && response.data) {
            console.log('배너 데이터 받음:', response.data);
            
            // URL 처리하여 배너 목록 설정
            const processedBanners = response.data.map(banner => {
              console.log('처리할 배너 데이터:', JSON.stringify(banner));
              
              // file_path와 file_name으로 이미지 경로 생성
              let imageUrl = '';
              
              if (banner.file_path && banner.file_name) {
                // file_path와 file_name 조합
                const imagePath = `${banner.file_path}/${banner.file_name}`.replace(/^\//, '');
                console.log('Supabase 이미지 경로:', imagePath);
                
                try {
                  const { data } = supabase.storage
                    .from('banner')
                    .getPublicUrl(imagePath);
                    
                  if (data && data.publicUrl) {
                    imageUrl = data.publicUrl;
                    console.log('Supabase URL 생성 성공:', imageUrl);
                  } else {
                    console.log('Supabase URL 생성 실패:', data);
                  }
                } catch (err) {
                  console.error('Supabase URL 생성 중 오류:', err);
                }
              } else if (banner.banner_img_url) {
                // 기존 banner_img_url이 있는 경우
                imageUrl = banner.banner_img_url;
                console.log('원본 이미지 URL 사용:', imageUrl);
                
                // 경로만 있는 경우 Supabase URL로 변환
                if (imageUrl && !imageUrl.includes('http')) {
                  try {
                    const { data } = supabase.storage
                      .from('banner')
                      .getPublicUrl(imageUrl);
                      
                    if (data && data.publicUrl) {
                      imageUrl = data.publicUrl;
                      console.log('Supabase URL 생성 성공:', imageUrl);
                    } else {
                      console.log('Supabase URL 생성 실패:', data);
                    }
                  } catch (err) {
                    console.error('Supabase URL 생성 중 오류:', err);
                  }
                }
              } else {
                console.log('배너 이미지 정보 없음:', banner);
              }
              
              const processedBanner = {
                ...banner,
                banner_img_url: imageUrl
              };
              
              console.log('처리된 배너:', JSON.stringify(processedBanner));
              return processedBanner;
            });
            
            const filteredBanners = processedBanners.filter(b => b.banner_img_url);
            console.log('필터링된 배너 개수:', filteredBanners.length);
            setBanners(filteredBanners);
          } else {
            console.log('배너 데이터 없음');
            setBanners([]);
          }
        } catch (error) {
          console.error('배너 로드 실패:', error);
          setBanners([]);
        } finally {
          setLoading(false);
        }
      };
      
      loadBanners();
    }, [bannerLocate])
  );

  // 배너 클릭 핸들러
  const handleBannerPress = (banner: BannerItem) => {
    if (banner.banner_link_url) {
      Linking.openURL(banner.banner_link_url).catch(err => 
        console.error('배너 링크를 열 수 없습니다:', err)
      );
    }
  };

  // 인디케이터 점 렌더링 함수
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {banners.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.dot, 
              index === currentIndex && styles.activeDot
            ]} 
          />
        ))}
      </View>
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
                style={[
                  styles.bannerImage,
                  bannerLocate === "SHOP" && styles.shopBannerImage
                ]}
                resizeMode={bannerLocate === "SHOP" ? "cover" : "cover"}
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
          {banners.length > 1 && renderDots()}
        </View>
      ) : (
        <Text style={styles.placeholderText}>배너 이미지가 없습니다.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: scale(20),
  },
  bannerImage: {
    width: '100%',
    height: scale(150),
    maxHeight: scale(200),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  shopBannerImage: {
    borderRadius: 0,
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: scale(10),
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: scale(4),
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
  placeholderText: {
    color: '#999999',
    fontSize: scale(14),
    textAlign: 'center',
  },
  errorContainer: {
    width: '100%',
    height: scale(150),
    backgroundColor: '#555555',
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    textAlign: 'center',
  },
  skeletonDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: scale(4),
  },
  loadingContainer: {
    width: '100%',
    height: scale(150),
    backgroundColor: '#333333',
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BannerImagePicker;