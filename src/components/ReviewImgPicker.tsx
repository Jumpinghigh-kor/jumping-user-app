import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';

interface ReviewImgPickerProps {
  maxImages?: number;
  onImagesSelected: (images: Asset[]) => void;
}

const ReviewImgPicker: React.FC<ReviewImgPickerProps> = ({
  maxImages = 3,
  onImagesSelected,
}) => {
  const [selectedImages, setSelectedImages] = useState<Asset[]>([]);

  const handleImagePicker = async (index: number) => {
    // 이미 이미지가 있는 경우
    if (selectedImages[index]) {
      Alert.alert(
        '이미지 변경',
        '이미지를 변경하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '카메라', onPress: () => openCamera(index) },
          { text: '갤러리', onPress: () => openGallery(index) },
          { text: '삭제', onPress: () => removeImage(index), style: 'destructive' },
        ],
        { cancelable: true }
      );
      return;
    }

    // 새로운 이미지 선택
    Alert.alert(
      '이미지 선택',
      '이미지를 어디서 가져올까요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '카메라', onPress: () => openCamera(index) },
        { text: '갤러리', onPress: () => openGallery(index) },
      ],
      { cancelable: true }
    );
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: '카메라 권한',
            message: '사진을 찍기 위해 카메라 권한이 필요합니다.',
            buttonNeutral: '나중에 묻기',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('카메라 권한 요청 오류:', err);
        return false;
      }
    }
    return true; // iOS는 image-picker에서 자체적으로 권한 요청
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
        console.error('갤러리 권한 요청 오류:', err);
        return false;
      }
    }
    return true; // iOS는 image-picker에서 자체적으로 권한 요청
  };

  const openCamera = async (index: number) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('권한 거부됨', '카메라 권한이 거부되었습니다.');
      return;
    }

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        updateImage(index, result.assets[0]);
      }
    } catch (error) {
      console.error('카메라 오류:', error);
    }
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
      });

      if (result.assets && result.assets.length > 0) {
        updateImage(index, result.assets[0]);
      }
    } catch (error) {
      console.error('갤러리 오류:', error);
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

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages[index] = null;
    setSelectedImages(newImages);
    onImagesSelected(newImages.filter(Boolean));
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
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>사진 업로드</Text>
      <View style={styles.photoUploadContainer}>
        {renderImageBoxes()}
      </View>
    </View>
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
});

export default ReviewImgPicker; 