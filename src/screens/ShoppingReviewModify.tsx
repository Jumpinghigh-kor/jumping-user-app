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
import { insertMemberReviewApp, updateMemberReviewApp, deleteMemberReviewApp } from '../api/services/memberReviewAppService';
import CommonPopup from '../components/CommonPopup';
import { supabase } from '../utils/supabaseClient';
import { deleteCommonFile } from '../api/services/commonCodeService';

// 네비게이션 타입 정의
type RootStackParamList = {
  ShoppingReview: undefined;
};

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  review_app_id: number;
  product_app_id: number;
  product_detail_app_id: number;
  product_name: string;
  product_title: string;
  brand_name: string;
  content: string;
  star_point: number;
  review_title: string;
  option_type: string;
  option_amount: number;
  order_quantity: number;
  option_unit: string;
}

const ShoppingReviewModify: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [title, setTitle] = useState(params?.review_title || '');
  const [content, setContent] = useState(params?.content || '');
  const [starPoint, setStarPoint] = useState(params?.review_app_id ? (params?.star_point || 5) : 0);
  const [reviewImages, setReviewImages] = useState<Asset[]>([]);
  const [fileIds, setFileIds] = useState<number[]>([]);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'default' | 'warning'>('default');
  const [onPopupConfirm, setOnPopupConfirm] = useState<() => void>(() => {});
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedFilePaths, setUploadedFilePaths] = useState<string[]>([]);
  
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  // Supabase에서 파일 삭제 함수
  const deleteFileFromSupabase = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('review')
        .remove([filePath]);
      
      if (error) {
        console.error('Supabase 파일 삭제 실패:', error);
      }
    } catch (error) {
      console.error('파일 삭제 중 오류:', error);
    }
  };

  const handleTextChange = (text: string, setter: (value: string) => void, maxLength: number) => {
    if (text.length <= maxLength) {
      setter(text);
    }
  };

  const handleImagesSelected = (images: Asset[]) => {
    setReviewImages(images);
  };

  const handleFileIdsChange = (ids: number[], filePaths?: string[]) => {    
    setFileIds(ids);
    if (filePaths) {
      setUploadedFilePaths(filePaths);
    }
  };

  const showPopup = (message: string, type: 'default' | 'warning' = 'default', onConfirm?: () => void) => {
    setPopupMessage(message);
    setPopupType(type);
    setIsDeleteConfirm(false);
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
    
    try {
      let response;
      let uploadedFileNames: string[] = [];
      
      if (reviewImages.length > 0) {
        uploadedFileNames = reviewImages.map(img => img.fileName).filter(Boolean);
      }

      if (params?.review_app_id) {
        response = await updateMemberReviewApp({
          review_app_id: params.review_app_id,
          title: title,
          content: content,
          star_point: starPoint,
          mem_id: Number(memberInfo?.mem_id),
          file_name: uploadedFileNames.length > 0 ? uploadedFileNames : undefined,
          file_ids: fileIds.length > 0 ? fileIds : undefined
        });
      } else { 
        response = await insertMemberReviewApp({
          mem_id: Number(memberInfo?.mem_id),
          product_app_id: params.product_app_id,
          title: title,
          content: content,
          star_point: starPoint,
          file_ids: fileIds.length > 0 ? fileIds : undefined
        });
      }
      
      if (response.success) {
        setIsSubmitted(true);
        showPopup(params?.review_app_id ? '리뷰가 수정되었습니다.' : '리뷰가 작성되었습니다.', 'default', () => {
          setPopupVisible(false);
          navigation.navigate('ShoppingReview');
        });
      } else {
        showPopup(response.message || (params?.review_app_id ? '리뷰 수정 중 오류가 발생했습니다.' : '리뷰 작성 중 오류가 발생했습니다.'), 'warning');
      }
    } catch (error) {
      showPopup(params?.review_app_id ? '리뷰 수정 중 오류가 발생했습니다.' : '리뷰 작성 중 오류가 발생했습니다.', 'warning');
    }
  };

  const handleDelete = async () => {
    if (!params?.review_app_id) return;
    
    setPopupMessage('리뷰를 삭제하시겠습니까?');
    setPopupType('default');
    setIsDeleteConfirm(true);
    setOnPopupConfirm(() => async () => {
      setPopupVisible(false);
      
      try {
        const response = await deleteMemberReviewApp({
          review_app_id: params.review_app_id,
          mem_id: Number(memberInfo?.mem_id),
        });
        
        if (response.success) {
          setIsSubmitted(true);
          showPopup('리뷰가 삭제되었습니다.', 'default', () => {
            setPopupVisible(false);
            navigation.navigate('ShoppingReview');
          });
        } else {
          showPopup(response.message || '리뷰 삭제 중 오류가 발생했습니다.', 'warning');
        }
      } catch (error) {
        showPopup('리뷰 삭제 중 오류가 발생했습니다.', 'warning');
      }
    });
    setPopupVisible(true);
  };

  const handleCleanup = () => {
    if (!isSubmitted && uploadedFilePaths.length > 0) {
      // DB에서 파일 정보 삭제
      fileIds.forEach(async (fileId) => {
        try {
          await deleteCommonFile({
            file_id: fileId,
            mem_id: Number(memberInfo?.mem_id)
          });
        } catch (error) {
          console.error('deleteCommonFile 실패:', error);
        }
      });

      // Supabase Storage에서 파일 삭제
      uploadedFilePaths.forEach(filePath => {
        deleteFileFromSupabase(filePath);
      });
    }
  };
  
  return (
    <>
      <CommonHeader 
        title={params?.review_app_id ? "리뷰 수정" : "리뷰 작성하기"}
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        onCleanup={handleCleanup}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.productContainer}>
          <ShoppingThumbnailImg 
            productAppId={params?.product_app_id || 0}
            width={scale(80)} 
            height={scale(80)}
            style={styles.thumbnailImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.brandName} numberOfLines={1} ellipsizeMode="tail">{params?.brand_name}</Text>
            <Text style={styles.productTitle} numberOfLines={2} ellipsizeMode="tail">{params?.product_title}</Text>
            <Text style={styles.productDetail} numberOfLines={2} ellipsizeMode="tail">{params?.product_name} {params?.option_amount}{params?.option_unit} / {params?.order_quantity}개</Text>
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
            onChangeText={(text) => handleTextChange(text, setTitle, 25)}
            placeholder="제목을 입력하세요"
            placeholderTextColor="#AAAAAA"
          />
          <Text style={styles.charCount}><Text style={{color: '#4C78E0'}}>{title.length}</Text> / 25</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={(text) => handleTextChange(text, setContent, 3000)}
            placeholder="내용을 입력하세요"
            placeholderTextColor="#AAAAAA"
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}><Text style={{color: '#4C78E0'}}>{content.length}</Text> / 3000</Text>
        </View>

        <View style={{marginBottom: scale(10)}}>
          <ReviewImgPicker 
            maxImages={3} 
            onImagesSelected={handleImagesSelected}
            onFileIdsChange={handleFileIdsChange}
            memberId={memberInfo?.mem_id}
            reviewAppId={params?.review_app_id}
          />
        </View>

        <View style={styles.buttonContainer}>
          {params?.review_app_id && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>삭제하기</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.submitButton, {flex: params?.review_app_id ? 0 : 1}]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {params?.review_app_id ? "수정하기" : "작성 완료"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CommonPopup
        visible={popupVisible}
        message={popupMessage}
        type={popupType}
        onConfirm={onPopupConfirm}
        {...(isDeleteConfirm && {
          onCancel: () => setPopupVisible(false),
          confirmText: "확인",
          cancelText: "취소"
        })}
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
    flex: 1,
    flexShrink: 1,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
    marginLeft: scale(10),
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
    paddingHorizontal: scale(12),
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scale(20),
    gap: scale(8),
  },
  submitButton: {
    width: '50%',
    backgroundColor: '#43B546',
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(10),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
  deleteButton: {
    width: '50%',
    backgroundColor: '#F04D4D',
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(10),
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
});

export default ShoppingReviewModify; 