import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, StyleProp, ImageStyle } from 'react-native';
import { scale } from '../utils/responsive';
import { getProductAppThumbnailImg } from '../api/services/productAppService';
import { supabase } from '../utils/supabaseClient';
import IMAGES from 'src/utils/images';

interface ShoppingThumbnailImgProps {
  productAppId: number;
  style?: StyleProp<ImageStyle>;
  width?: number;
  height?: number;
  borderRadius?: number;
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
  borderRadius = scale(4)
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailData, setThumbnailData] = useState<ThumbnailData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThumbnailData();
  }, []);

  useEffect(() => {
    if (thumbnailData) {
      const url = getSupabaseImageUrl();
      setImageUrl(url);
      setLoading(false);
    }
  }, [thumbnailData, productAppId]);

  const fetchThumbnailData = async () => {
    try {
      const response = await getProductAppThumbnailImg();
      setThumbnailData(response.data || []);
    } catch (error) {
      console.error('썸네일 데이터 로드 오류:', error);
      setLoading(false);
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
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={[defaultStyles, style]}
        />
      )}
    </>
  );
};

export default ShoppingThumbnailImg; 