import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, StyleProp, ImageStyle, View, Text } from 'react-native';
import { scale } from '../utils/responsive';
import { getProductAppThumbnailImg } from '../api/services/productAppService';
import { supabase } from '../utils/supabaseClient';
import IMAGES from '../utils/images';

interface ShoppingThumbnailImgProps {
  productAppId: number;
  style?: StyleProp<ImageStyle>;
  width?: number;
  height?: number;
  borderRadius?: number;
  quantity?: number;
}

interface ThumbnailData {
  product_app_id: number;
  file_path?: string;
  file_name?: string;
  image_url?: string;
}

const ShoppingThumbnailImg: React.FC<ShoppingThumbnailImgProps> = ({
  productAppId,
  style,
  width = scale(80),
  height = scale(80),
  borderRadius = scale(4),
  quantity,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailData, setThumbnailData] = useState<ThumbnailData[] | null>(null);

  useEffect(() => {
    fetchThumbnailData();
  }, []);

  useEffect(() => {
    if (thumbnailData) {
      const url = getSupabaseImageUrl();
      setImageUrl(url);
    }
  }, [thumbnailData, productAppId]);

  const fetchThumbnailData = async () => {
    try {
      const response = await getProductAppThumbnailImg();
      setThumbnailData(response.data || []);
    } catch (error) {
    }
  };

  const getSupabaseImageUrl = () => {
    if (!thumbnailData) return null;
    
    // 썸네일 데이터에서 현재 상품과 일치하는 이미지 정보 찾기
    const thumbnailItem = thumbnailData.find(thumb => thumb.product_app_id === productAppId);
    
    if (!thumbnailItem) return null;
    
    // file_path와 file_name으로 이미지 경로 생성
    if (thumbnailItem.file_path && thumbnailItem.file_name) {
      const imagePath = `${thumbnailItem.file_path}/${thumbnailItem.file_name}`.replace(/^\//, '');
      const { data } = supabase.storage.from('product').getPublicUrl(imagePath);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    }
    
    // image_url이 있는 경우
    if (thumbnailItem.image_url) {
      // 경로만 있는 경우 Supabase URL로 변환
      if (!thumbnailItem.image_url.includes('http')) {
        const { data } = supabase.storage.from('product').getPublicUrl(thumbnailItem.image_url);
        if (data && data.publicUrl) {
          return data.publicUrl;
        }
      }
      return thumbnailItem.image_url;
    }
    
    return null;
  };

  const defaultStyles: StyleProp<ImageStyle> = {
    width,
    height,
    borderRadius,
    backgroundColor: '#EEEEEE',
  };

  return (
    <>
      {imageUrl ? (
        <View style={{position: 'relative', overflow: 'hidden'}}>
          <Image
            source={{ uri: imageUrl }}
            style={[defaultStyles, style]}
            />
          {quantity === 0 && (
            <View style={styles.soldOutContainer}>
              <Text style={styles.soldOutText}>품절</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <View style={[styles.noImageContainer, {
            width,
            height,
            borderRadius,
          }]}>
            <Image 
              source={IMAGES.icons.sadFaceGray} 
              style={{width: scale(20), height: scale(20)}}
            />
            <Text style={styles.noImageText}>이미지가 없어요</Text>
            {quantity === 0 && (
              <View style={[styles.soldOutContainer, {
                borderRadius,
              }]}>
                <Text style={styles.soldOutText}>품절</Text>
              </View>
            )}
          </View>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  noImageContainer: {
    position: 'relative',
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  noImageText: {
    fontSize: scale(8),
    fontFamily: 'Pretendard-Medium',
    color: '#848484',
    marginTop: scale(10),
  },
  soldOutContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
});

export default ShoppingThumbnailImg; 