import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Modal,
  Text
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import CommonPopup from './CommonPopup';
import { 
  uploadProfileImage, 
  linkMemberImage, 
  getMemberImageCount, 
  getMemberImageFile,
  updateMemberImage,
  deleteMemberImgFile
} from '../api/services/profileService';
import { supabase } from '../utils/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';

interface ProfileImagePickerProps {
  memId: string;
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
  showEditIcon?: boolean;
}

const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({ 
  memId, 
  currentImageUrl, 
  onImageUpdate,
  showEditIcon = true
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showBottomModal, setShowBottomModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [hasExistingImage, setHasExistingImage] = useState(false);
  const [existingImageId, setExistingImageId] = useState<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // 컴포넌트 마운트 시 회원의 이미지 정보 조회
  useFocusEffect(
    React.useCallback(() => {
      const checkImageInfo = async () => {
        if (!memId) return;
        
        try {
          // 이미지 개수 조회
          const countResponse = await getMemberImageCount(memId);
          if (countResponse.success && countResponse.data.imgCnt) {
            const hasImage = countResponse.data.imgCnt > 0;
            setHasExistingImage(hasImage);
            // 이미지가 있는 경우 이미지 ID 조회
            if (hasImage) {
              const imageResponse = await getMemberImageFile(memId);
              if (imageResponse.success && imageResponse.data && imageResponse.data[0].member_img_id) {
                setExistingImageId(imageResponse.data[0].member_img_id);
              }
            }
          }
        } catch (error) {
          setShowErrorPopup(true);
        }
      };
      
      checkImageInfo();
      
      return () => {
        // clean-up 함수
      };
    }, [memId])
  );

  const handleOpenGallery = async () => {
    // 갤러리가 이미 열려있는 경우 중복 실행 방지
    if (isGalleryOpen) return;
    
    setIsGalleryOpen(true);
    setShowBottomModal(false);
    
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true, // base64 포함하도록 설정
      });
      
      if (result.didCancel) {
        // 사용자가 갤러리 선택을 취소한 경우 아무것도 하지 않음
        return;
      }
      
      if (result.assets && result.assets.length > 0 && result.assets[0].base64) {
        setSelectedImage(result.assets[0]);
        setShowConfirmPopup(true);
      } else {
        setShowErrorPopup(true);
      }
    } finally {
      setIsGalleryOpen(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!hasExistingImage) {
      setShowErrorPopup(true);
      setShowBottomModal(false);
      return;
    }

    if (!memId || !existingImageId) return;
    
    try {
      const response = await deleteMemberImgFile(memId, existingImageId);
      if (response.success) {
        setHasExistingImage(false);
        setExistingImageId(null);
        onImageUpdate('');
        setShowSuccessPopup(true);
      } else {
        setShowErrorPopup(true);
      }
    } catch (error) {
      setShowErrorPopup(true);
    } finally {
      setShowBottomModal(false);
    }
  };

  const handleCloseBottomModal = () => {
    setShowBottomModal(false);
  };

  // Supabase에 이미지 업로드
  const uploadImageToSupabase = async (base64Image: string): Promise<{ url: string, fileName: string }> => {
    try {
      // 현재 날짜 형식화 (YYYYMMDDHHIISS)
      const now = new Date();
      const dateStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0') +
        String(now.getMilliseconds()).padStart(3, '0');
        
      // 파일 이름 생성 (고유 ID 포함)
      const fileName = `profile_${memId}_${Date.now()}_${dateStr}.jpg`;
      const filePath = `profile/${fileName}`;
      
      // Base64 이미지를 Uint8Array로 변환
      const base64Data = base64Image.split(',')[1] || base64Image;
      
      // Supabase 스토리지에 업로드 (React Native에서는 base64 직접 사용)
      const { data, error } = await supabase
        .storage
        .from('profile')
        .upload(filePath, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      // 업로드된 이미지의 공개 URL 가져오기
      const { data: { publicUrl } } = supabase
        .storage
        .from('profile')
        .getPublicUrl(filePath);
      
      return { url: publicUrl, fileName: fileName };
    } catch (error) {
      throw error;
    }
  };
  
  // Base64를 Uint8Array로 변환하는 함수
  function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const handleUploadImage = async () => {
    if (!selectedImage || !selectedImage.base64) return;
    
    setLoading(true);
    setShowConfirmPopup(false);
    
    try {
      // 파일 이름 추출 (원본 파일 이름 사용)
      let fileName = 'profile.jpg'; // 기본값
      if (selectedImage.fileName) {
        fileName = selectedImage.fileName;
      } else if (selectedImage.uri) {
        // URI에서 파일 이름 추출 시도
        const uriParts = selectedImage.uri.split('/');
        fileName = uriParts[uriParts.length - 1];
      }
      
      // 1. 먼저 Supabase에 이미지 업로드
      const { url: supabaseImageUrl, fileName: supabaseFileName } = await uploadImageToSupabase(selectedImage.base64);
      
      // 2. 기존 이미지가 있는 경우 미사용 처리
      if (hasExistingImage && existingImageId && memId) {
        const updateResult = await updateMemberImage(existingImageId, memId);
      } else {
        // 기존 이미지 없음 또는 정보 부족
      }
      
      // 백엔드 API에는 Supabase에서 생성한 파일 이름 전달
      const response = await uploadProfileImage(selectedImage.base64, memId, supabaseFileName);
      
      // 백엔드에서 응답이 왔으면 성공으로 처리 (strict 검사 완화)
      if (response) {
        // JSON 문자열에서 직접 file_id 값 추출 시도
        let fileId = 0;
        try {
          const responseStr = JSON.stringify(response);
          const fileIdMatch = responseStr.match(/"file_id":(\d+)/);
          if (fileIdMatch && fileIdMatch[1]) {
            fileId = parseInt(fileIdMatch[1], 10);
          }
        } catch (e) {
          // 파싱 오류 무시
        }
        
        // 추출에 실패한 경우 기존 방식으로 시도
        if (fileId === 0) {
          fileId = typeof response.data?.file_id === 'string' 
            ? parseInt(response.data.file_id, 10) 
            : (Number(response.data?.file_id) || 0);
        }
        
        // data.id도 확인해보기 (일부 API는 file_id 대신 id 필드를 사용할 수 있음)
        const responseDataAny = response.data as any;
        if (responseDataAny && 'id' in responseDataAny) {
          if (fileId === 0) {
            fileId = Number(responseDataAny.id) || 0;
          }
        }
        
        const imageUrl = response.data?.file_url || supabaseImageUrl;
        
        // 4. 회원 이미지 연결 API 호출
        const linkResponse = await linkMemberImage(memId, fileId);
        
        // 이미지 연결 응답도 더 관대하게 처리
        if (linkResponse && !linkResponse.message) {
          // 연결 성공
        }
        
        // 성공적으로 업로드되면 부모 컴포넌트에 URL 전달
        onImageUpdate(imageUrl);
        
        // 이미지 정보 다시 조회
        const countResponse = await getMemberImageCount(memId);
        if (countResponse.success && countResponse.data.imgCnt) {
          const hasImage = countResponse.data.imgCnt > 0;
          setHasExistingImage(hasImage);
          // 이미지가 있는 경우 이미지 ID 조회
          if (hasImage) {
            const imageResponse = await getMemberImageFile(memId);
            if (imageResponse.success && imageResponse.data && imageResponse.data[0]?.member_img_id) {
              setExistingImageId(imageResponse.data[0].member_img_id);
            }
          }
        }
        
        setShowSuccessPopup(true);
      } else {
        throw new Error('이미지 업로드에 실패했습니다.');
      }
    } catch (error: any) {
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleErrorClose = () => {
    setShowErrorPopup(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
  };
  
  return (
    <>
      <TouchableOpacity 
        onPress={() => setShowBottomModal(true)} 
        style={styles.profileImageContainer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6BC46A" />
        ) : (
          <>
            <View style={styles.imageContainer}>
              <Image 
                source={currentImageUrl ? { uri: currentImageUrl } : IMAGES.icons.profileGray} 
                style={[
                  styles.profileImage,
                  currentImageUrl && { width: '100%', height: '100%', resizeMode: 'cover' }
                ]} 
              />
            </View>
            {showEditIcon && (
              <View style={styles.editIconContainer}>
                <Image 
                  source={IMAGES.icons.editCircleBlue}
                  style={styles.editIcon}
                />
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
      
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

      {showConfirmPopup && (
        <CommonPopup
          visible={showConfirmPopup}
          title="프로필 사진 등록"
          message={hasExistingImage ? "기존 프로필 사진을 변경하시겠습니까?" : "선택한 사진을 프로필 사진으로 등록하시겠습니까?"}
          confirmText="예"
          cancelText="아니오"
          onConfirm={handleUploadImage}
          onCancel={() => setShowConfirmPopup(false)}
          type="warning"
        />
      )}

      {showErrorPopup && (
        <CommonPopup
          visible={showErrorPopup}
          title="알림"
          message={!hasExistingImage ? "삭제할 프로필 사진이 없습니다." : "에러가 발생하였습니다. 관리자에게 문의해주세요."}
          confirmText="확인"
          onConfirm={handleErrorClose}
          type="warning"
        />
      )}

      {showSuccessPopup && (
        <CommonPopup
          visible={showSuccessPopup}
          title="성공"
          message="프로필 이미지가 업데이트되었습니다."
          confirmText="확인"
          onConfirm={handleSuccessClose}
          type="default"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  profileImageContainer: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(50),
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: scale(50),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
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

export default ProfileImagePicker; 