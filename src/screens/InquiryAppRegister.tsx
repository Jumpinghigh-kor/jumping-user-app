import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createInquiry } from '../api/services/inquiryService';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import type { AuthStackParamList } from '../navigation/AuthStackNavigator';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const MAX_TITLE_LENGTH = 300; // varchar(300) 제한
const MAX_CONTENT_LENGTH = 1000;

const InquiryAppRegister = () => {
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return false;
    }
    
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log('Preventing duplicate submission');
      return; // 중복 클릭 방지
    }
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      
      const memId = await AsyncStorage.getItem('mem_id');
      
      if (!memId) {
        Alert.alert('알림', '로그인이 필요합니다.');
        setIsSubmitting(false);
        setLoading(false);
        return;
      }
      
      const response = await createInquiry({
        title: title.trim(),
        content: content.trim(),
        mem_id: parseInt(memId, 10),
      });
      
      if (response.success) {
        setPopupMessage('문의가 등록되었습니다.');
        setPopupVisible(true);
      } else {
        Alert.alert('알림', response.message || '문의 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('문의 등록 에러:', error);
      Alert.alert('알림', '문의 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handlePopupConfirm = () => {
    setPopupVisible(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={IMAGES.icons.arrowLeftWhite} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>문의하기</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요 (최대 300자)"
            placeholderTextColor="#999999"
            maxLength={MAX_TITLE_LENGTH}
          />
          <Text style={styles.counter}>
            {title.length}/{MAX_TITLE_LENGTH}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={(text) => {
              if (text.length <= MAX_CONTENT_LENGTH) {
                setContent(text);
              }
            }}
            placeholder="문의 내용을 입력해주세요"
            placeholderTextColor="#999999"
            multiline
            textAlignVertical="top"
            maxLength={MAX_CONTENT_LENGTH}
          />
          <Text style={styles.counter}>
            {content.length}/{MAX_CONTENT_LENGTH}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, (loading || isSubmitting) && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading || isSubmitting}
      >
        {loading || isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>등록하기</Text>
        )}
      </TouchableOpacity>

      <CommonPopup
        visible={popupVisible}
        message={popupMessage}
        onConfirm={handlePopupConfirm}
        confirmText="확인"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 0,
    borderBottomColor: '#333333',
    backgroundColor: '#202020',
    marginTop: scale(5),
  },
  backButton: {
    width: scale(30),
    height: scale(30),
    justifyContent: 'center',
  },
  backIcon: {
    width: scale(20),
    height: scale(20),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  headerRight: {
    width: scale(40),
  },
  formContainer: {
    flex: 1,
    padding: scale(16),
  },
  formContentContainer: {
    paddingBottom: scale(80),
  },
  inputContainer: {
    marginBottom: scale(20),
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(14),
    marginBottom: scale(8),
    fontWeight: 'bold',
  },
  titleInput: {
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(12),
    color: '#FFFFFF',
    fontSize: scale(14),
  },
  contentInput: {
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(12),
    color: '#FFFFFF',
    fontSize: scale(14),
    minHeight: scale(200),
  },
  counter: {
    color: '#999999',
    fontSize: scale(12),
    textAlign: 'right',
    marginTop: scale(4),
  },
  submitButton: {
    position: 'absolute',
    bottom: scale(20),
    left: scale(16),
    right: scale(16),
    backgroundColor: '#43B546',
    height: scale(50),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666666',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
});

export default InquiryAppRegister; 