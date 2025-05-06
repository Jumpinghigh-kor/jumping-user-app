import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import ReviewImgPicker from '../components/ReviewImgPicker';
import { Asset } from 'react-native-image-picker';
import { insertMemberReviewApp } from '../api/services/memberReviewAppService';
import CommonPopup from '../components/CommonPopup';

// 네비게이션 타입 정의
type RootStackParamList = {
  ShoppingReview: undefined;
};

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  reviewAppId: number;
  productAppId: number;
  productName: string;
  productTitle: string;
  brandName: string;
  content: string;
  starPoint: number;
  reviewTitle: string;
  optionType: string;
  optionAmount: number;
  optionQuantity: number;
}

const ShoppingReviewModify: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [title, setTitle] = useState(params?.reviewTitle || '');
  const [content, setContent] = useState(params?.content || '');
  const [starPoint, setStarPoint] = useState(params?.reviewAppId ? (params?.starPoint || 5) : 0);
  const [loading, setLoading] = useState(false);
  const [reviewImages, setReviewImages] = useState<Asset[]>([]);
  
  // CommonPopup 상태
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'default' | 'warning'>('default');
  const [onPopupConfirm, setOnPopupConfirm] = useState<() => void>(() => {});
  
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  const handleTitleChange = (text: string) => {
    if (text.length <= 25) {
      setTitle(text);
    }
  };

  const handleContentChange = (text: string) => {
    if (text.length <= 3000) {
      setContent(text);
    }
  };

  const handleImagesSelected = (images: Asset[]) => {
    setReviewImages(images);
  };

  const showPopup = (message: string, type: 'default' | 'warning' = 'default', onConfirm?: () => void) => {
    setPopupMessage(message);
    setPopupType(type);
    if (onConfirm) {
      setOnPopupConfirm(() => onConfirm);
    } else {
      setOnPopupConfirm(() => () => setPopupVisible(false));
    }
    setPopupVisible(true);
  };

  const handleSubmit = async () => {
    if (starPoint === 0) {
      showPopup('별점을 선택해주세요.', 'warning');
      return;
    }
    
    if (!title.trim()) {
      showPopup('제목을 입력해주세요.', 'warning');
      return;
    }
    
    if (!content.trim()) {
      showPopup('내용을 입력해주세요.', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      // 파일 이름 배열 생성 (파일이 있는 경우)
      const fileNames = reviewImages.map(img => img.fileName);
      
      const response = await insertMemberReviewApp({
        mem_id: Number(memberInfo?.mem_id),
        product_app_id: params.productAppId,
        title: title,
        content: content,
        star_point: starPoint,
        file_name: fileNames.length > 0 ? fileNames : undefined
      });
      
      if (response.success) {
        showPopup('리뷰가 작성되었습니다.', 'default', () => {
          setPopupVisible(false);
          navigation.navigate('ShoppingReview');
        });
      } else {
        showPopup(response.message || '리뷰 작성 중 오류가 발생했습니다.', 'warning');
      }
    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      showPopup('리뷰 작성 중 오류가 발생했습니다.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const homeIcon = (
    <TouchableOpacity 
      style={styles.homeBtn}
      onPress={() => navigation.navigate('ShoppingReview')}
    >
      <Image source={IMAGES.icons.homeStrokeBlack} style={styles.homeIcon} />
    </TouchableOpacity>
  );

  return (
    <>
      <CommonHeader 
        title={params?.reviewAppId ? "리뷰 수정" : "리뷰 작성하기"}
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        rightIcon={homeIcon}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.productContainer}>
          <ShoppingThumbnailImg 
            productAppId={params?.productAppId || 0}
            width={scale(80)} 
            height={scale(80)}
            style={styles.thumbnailImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.brandName}>{params?.brandName}</Text>
            <Text style={styles.productTitle}>{params?.productTitle}</Text>
            <Text style={styles.productDetail}>{params?.productName} {params?.optionAmount} {params?.optionType == 'WEIGHT' ? 'KG' : params?.optionType == 'SIZE' ? 'SIZE' : ''} / {params?.optionQuantity}개</Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.sectionTitle}>상품 만족도</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star} 
                onPress={() => setStarPoint(star)}
                style={styles.starButton}
              >
                <Image 
                  source={star <= starPoint ? IMAGES.icons.starYellow : IMAGES.icons.starGray} 
                  style={styles.starImage} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.sectionTitle, {marginTop: scale(8)}]}>리뷰 작성하기</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="제목을 입력하세요"
            placeholderTextColor="#AAAAAA"
            maxLength={25}
          />
          <Text style={styles.charCount}><Text style={{color: '#4C78E0'}}>{title.length}</Text> / 25</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={handleContentChange}
            placeholder="내용을 입력하세요"
            placeholderTextColor="#AAAAAA"
            multiline
            textAlignVertical="top"
            maxLength={3000}
          />
          <Text style={styles.charCount}><Text style={{color: '#4C78E0'}}>{content.length}</Text> / 3000</Text>
        </View>

        <View style={{marginBottom: scale(30)}}>
          <ReviewImgPicker maxImages={3} onImagesSelected={handleImagesSelected} />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          disabled={loading}
          onPress={handleSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {params?.reviewAppId ? "수정하기" : "작성 완료"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CommonPopup
        visible={popupVisible}
        message={popupMessage}
        type={popupType}
        onConfirm={onPopupConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
  },
  homeBtn: {
    padding: scale(10),
  },
  homeIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  productContainer: {
    flexDirection: 'row',
    padding: scale(16),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
    marginBottom: scale(16),
    marginHorizontal: -scale(16),
  },
  thumbnailImage: {
    borderRadius: scale(8),
  },
  productInfo: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginLeft: scale(12),
    marginVertical: scale(8),
  },
  productDetail: {
    fontSize: scale(12),
    color: '#202020',
  },
  brandName: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#202020',
  },
  productTitle: {
    fontSize: scale(12),
    color: '#202020',
  },
  ratingContainer: {
    marginBottom: scale(16),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#202020',
    marginBottom: scale(10),
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: scale(8),
  },
  starImage: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  inputContainer: {
    marginBottom: scale(16),
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scale(8),
    padding: scale(12),
    fontSize: scale(14),
    height: Platform.OS === 'ios' ? scale(40) : scale(45),
  },
  charCount: {
    fontSize: scale(12),
    color: '#848484',
    textAlign: 'right',
    marginTop: scale(4),
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scale(8),
    padding: scale(12),
    fontSize: scale(14),
    height: scale(150),
  },
  submitButton: {
    backgroundColor: '#43B546',
    borderRadius: scale(8),
    padding: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(30),
    marginTop: scale(16),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
});

export default ShoppingReviewModify; 