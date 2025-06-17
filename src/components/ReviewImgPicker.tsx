import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { supabase } from '../utils/supabaseClient';
import { getMemberReviewAppImgList } from '../api/services/memberReviewAppService';
import { insertCommonFile, deleteCommonFile } from '../api/services/commonCodeService';

interface ReviewImgPickerProps {
  maxImages?: number;
  onImagesSelected: (images: Asset[]) => void;
  onFileIdsChange?: (fileIds: number[], filePaths?: string[]) => void;
  memberId?: string | number;
  reviewAppId?: number;
  disabled?: boolean;
  hideTitle?: boolean;
}

const ReviewImgPicker: React.FC<ReviewImgPickerProps> = ({
  maxImages = 3,
  onImagesSelected,
  onFileIdsChange,
  memberId,
  reviewAppId,
  disabled = false,
  hideTitle = false,
}) => {
  const [selectedImages, setSelectedImages] = useState<Asset[]>([]);
  const [fileIds, setFileIds] = useState<number[]>([]);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [showBottomModal, setShowBottomModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // 수정 모드일 때 기존 이미지 불러오기
  useEffect(() => {
    if (reviewAppId) {
      loadExistingImages();
    }
  }, [reviewAppId]);

  const loadExistingImages = async () => {
    try {
      const response = await getMemberReviewAppImgList({ review_app_id: reviewAppId });
      if (response.success && response.data) {
        // 기존 이미지를 Asset 형태로 변환하고 Supabase URL 생성
        const existingImages: Asset[] = response.data.map((img: any) => {
          let imageUrl = '';
          
          // file_name이 있으면 Supabase URL 생성
          if (img.file_name) {
            const filePath = `review/${img.file_name}`;
            const { data } = supabase.storage.from('review').getPublicUrl(filePath);
            if (data && data.publicUrl) {
              imageUrl = data.publicUrl;
            }
          } else if (img.file_url) {
            // file_name이 없으면 기존 file_url 사용
            imageUrl = img.file_url;
          }
          
          return {
            fileName: img.file_name,
            uri: imageUrl,
            type: 'image/jpeg',
          };
        });
        
        setSelectedImages(existingImages);
        onImagesSelected(existingImages);
      }
    } catch (error) {
      
    }
  };

  // Supabase 리뷰 이미지 업로드
  const uploadReviewImageToSupabase = async (base64Image: string): Promise<string | null> => {
    try {
      // 현재 날짜 형식화 (YYYYMMDDHHIISSMS)
      const now = new Date();
      const dateStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0') +
        String(now.getMilliseconds()).padStart(3, '0');
        
      const fileName = `review_${memberId}_${dateStr}.jpg`;
      const filePath = `review/${fileName}`;
      
      // Base64를 Uint8Array로 변환
      const base64Data = base64Image.split(',')[1] || base64Image;
      
      // Base64를 Uint8Array로 변환하는 함수
      function decode(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      
      // Supabase 스토리지에 업로드
      const { data, error } = await supabase
        .storage
        .from('review')
        .upload(filePath, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        
        return null;
      }
      
      return fileName;
    } catch (error) {
      
      return null;
    }
  };

  const handleImagePicker = async (index: number) => {
    if (disabled) return;
    setCurrentIndex(index);
    setShowBottomModal(true);
  };

  const handleCloseBottomModal = () => {
    setShowBottomModal(false);
  };

  const handleOpenGallery = async () => {
    if (isGalleryOpen) return;
    
    setIsGalleryOpen(true);
    setShowBottomModal(false);
    
    try {
      await openGallery(currentIndex);
    } finally {
      setIsGalleryOpen(false);
    }
  };

  const handleDeleteImage = () => {
    removeImage(currentIndex);
    setShowBottomModal(false);
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: '사진 접근 권한',
            message: '갤러리에서 사진을 선택하기 위해 접근 권한이 필요합니다.',
            buttonNeutral: '나중에 묻기',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        
        return false;
      }
    }
    return true; // iOS는 image-picker에서 자체적으로 권한 요청
  };

  const openGallery = async (index: number) => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('권한 거부됨', '갤러리 접근 권한이 거부되었습니다.');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Supabase에 업로드
        if (asset.base64 && memberId) {
          const fileName = await uploadReviewImageToSupabase(asset.base64);
          if (fileName) {
            try {
              const response = await insertCommonFile({
                file_name: fileName,
                file_path: '/review',
                file_division: 'review',
                mem_id: Number(memberId),
              });
              
              if (response.success && response?.file_id) {
                const newFileIds = [...fileIds, response.file_id];
                const newFilePaths = [...filePaths, `review/${fileName}`];
                setFileIds(newFileIds);
                setFilePaths(newFilePaths);
                if (onFileIdsChange) {
                  onFileIdsChange(newFileIds, newFilePaths);
                }
              }
            } catch (error) {
              
            }
            
            // 업로드된 파일명을 asset에 추가
            const updatedAsset = { ...asset, fileName: fileName };
            updateImage(index, updatedAsset);
          } else {
            updateImage(index, asset);
          }
        } else {
          updateImage(index, asset);
        }
      }
    } catch (error) {
      
    }
  };

  const updateImage = (index: number, asset: Asset) => {
    const newImages = [...selectedImages];
    // 배열 길이가 부족하면 채우기
    while (newImages.length <= index) {
      newImages.push(null);
    }
    newImages[index] = asset;
    setSelectedImages(newImages);
    onImagesSelected(newImages.filter(Boolean));
  };

  const removeImage = async (index: number) => {
    const imageToRemove = selectedImages[index];
    const fileIdToRemove = fileIds[index];
    
    // deleteCommonFile API 호출
    if (fileIdToRemove && memberId) {
      try {
        await deleteCommonFile({
          file_id: fileIdToRemove,
          mem_id: Number(memberId)
        });
      } catch (error) {
        console.error('deleteCommonFile 실패:', error);
      }
    }
    
    // Supabase에서 파일 삭제
    if (imageToRemove?.fileName) {
      try {
        const filePath = `review/${imageToRemove.fileName}`;
        const { error } = await supabase.storage
          .from('review')
          .remove([filePath]);
        
        if (error) {
          console.error('Supabase 파일 삭제 실패:', error);
        }
      } catch (error) {
        console.error('파일 삭제 중 오류:', error);
      }
    }
    
    const newImages = [...selectedImages];
    newImages[index] = null;
    setSelectedImages(newImages);
    onImagesSelected(newImages.filter(Boolean));
    
    // file_id도 함께 제거
    const newFileIds = [...fileIds];
    if (newFileIds[index] !== undefined) {
      newFileIds.splice(index, 1);
      setFileIds(newFileIds);
      if (onFileIdsChange) {
        onFileIdsChange(newFileIds, filePaths.filter((_, i) => i !== index));
      }
    }
  };

  // 표시할 이미지 박스 생성
  const renderImageBoxes = () => {
    const boxes = [];
    for (let i = 0; i < maxImages; i++) {
      boxes.push(
        <TouchableOpacity 
          key={i}
          style={styles.photoBox}
          onPress={() => handleImagePicker(i)}
          disabled={disabled}
        >
          {selectedImages[i]?.uri ? (
            <Image source={{ uri: selectedImages[i].uri }} style={styles.previewImage} />
          ) : (
            <>
              <Image source={IMAGES.icons.imgUploadGray} style={styles.uploadIcon} />
              <Text style={styles.uploadText}>사진 업로드</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }
    return boxes;
  };

  return (
    <>
      {selectedImages.length > 0 && (
        <View style={styles.container}>
          {!hideTitle && <Text style={styles.sectionTitle}>사진 업로드</Text>}
          <View style={styles.photoUploadContainer}>
            {renderImageBoxes()}
          </View>
        </View>
      )}

      <Modal
        visible={showBottomModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseBottomModal}
      >
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            <TouchableOpacity 
              style={styles.bottomModalOption} 
              onPress={handleOpenGallery}
            >
              <Image source={IMAGES.icons.pictureWhite} style={styles.bottomModalOptionImage} />
              <Text style={styles.bottomModalOptionText}>카메라/앨범</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.bottomModalOption} 
              onPress={handleDeleteImage}
            >
              <Image source={IMAGES.icons.garbageRed} style={styles.bottomModalOptionImage} />
              <Text style={[styles.bottomModalOptionText, {color: '#F04D4D'}]}>사진 삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.bottomModalOption} 
              onPress={handleCloseBottomModal}
            >
              <Image source={IMAGES.icons.xWhite} style={styles.bottomModalOptionImage} />
              <Text style={styles.bottomModalOptionText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(30),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#202020',
    marginBottom: scale(10),
  },
  photoUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  photoBox: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(8),
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadIcon: {
    width: scale(24),
    height: scale(24),
    tintColor: '#AAAAAA',
  },
  uploadText: {
    fontSize: scale(12),
    color: '#D9D9D9',
    fontWeight: '600',
    marginTop: scale(8),
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomModalContent: {
    backgroundColor: '#373737',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
  },
  bottomModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(15),
  },
  bottomModalOptionText: {
    fontSize: scale(12),
    color: '#FFFFFF',
    marginLeft: scale(10),
  },
  bottomModalOptionImage: {
    width: scale(14),
    height: scale(14),
  },
});

export default ReviewImgPicker; 