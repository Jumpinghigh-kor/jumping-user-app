import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { updateInquiry, Inquiry } from '../api/services/inquiryService';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import { formatDateYYYYMMDD } from '../utils/commonFunctions';
import type { AuthStackParamList } from '../navigation/AuthStackNavigator';

const MAX_TITLE_LENGTH = 300; // varchar(300) 제한
const MAX_CONTENT_LENGTH = 1000;

type InquiryAppDetailRouteProp = RouteProp<AuthStackParamList, 'InquiryAppDetail'>;

const InquiryAppDetail = () => {
  const navigation = useNavigation();
  const route = useRoute<InquiryAppDetailRouteProp>();
  const inquiry = route.params.inquiry as Inquiry;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const canEdit = !inquiry.answer;

  useEffect(() => {
    if (inquiry) {
      setTitle(inquiry.title);
      setContent(inquiry.content);
      
      // 답변이 있는 문의를 읽음으로 표시
      if (inquiry.answer) {
        markInquiryAsRead(inquiry.inquiry_app_id);
      }
    }
  }, [inquiry]);

  const markInquiryAsRead = async (inquiryId: number) => {
    try {
      const readInquiriesStr = await AsyncStorage.getItem('readInquiries');
      let readInquiries: number[] = readInquiriesStr ? JSON.parse(readInquiriesStr) : [];
      
      if (!readInquiries.includes(inquiryId)) {
        readInquiries.push(inquiryId);
        await AsyncStorage.setItem('readInquiries', JSON.stringify(readInquiries));
      }
    } catch (error) {
    }
  };

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

  const handleUpdate = async () => {
    if (isSubmitting) {
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
      
      const response = await updateInquiry({
        title: title.trim(),
        content: content.trim(),
        mem_id: parseInt(memId, 10),
        inquiry_app_id: inquiry.inquiry_app_id,
      });
      
      if (response.success) {
        setPopupMessage('문의가 수정되었습니다.');
        setPopupVisible(true);
      } else {
        Alert.alert('알림', response.message || '문의 수정에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('알림', '문의 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handlePopupConfirm = () => {
    setPopupVisible(false);
    navigation.goBack();
  };

  const toggleEdit = () => {
    if (!canEdit) {
      Alert.alert('알림', '답변이 등록된 문의는 수정할 수 없습니다.');
      return;
    }
    setIsEditing(!isEditing);
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
        <Text style={styles.headerTitle}>문의 상세</Text>
        {canEdit ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={toggleEdit}
          >
            <Text style={styles.editButtonText}>{isEditing ? '취소' : '수정'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editButton} />
        )}
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={[styles.titleInput, !isEditing && styles.readOnlyInput]}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요 (최대 300자)"
            placeholderTextColor="#999999"
            maxLength={MAX_TITLE_LENGTH}
            editable={isEditing && canEdit}
          />
          {isEditing && (
            <Text style={styles.counter}>
              {title.length}/{MAX_TITLE_LENGTH}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.contentInput, !isEditing && styles.readOnlyInput]}
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
            editable={isEditing && canEdit}
          />
          {isEditing && (
            <Text style={styles.counter}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </Text>
          )}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>{formatDateYYYYMMDD(inquiry.reg_dt)}</Text>
          </View>
        </View>
        
        {inquiry.answer && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>답변</Text>
            <View style={styles.answerContent}>
              <Text style={styles.answerText}>{inquiry.answer}</Text>
              {inquiry.answer_dt && (
                <Text style={styles.answerDate}>
                  {formatDateYYYYMMDD(inquiry.answer_dt)}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {isEditing && canEdit && (
        <TouchableOpacity
          style={[styles.submitButton, (loading || isSubmitting) && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={loading || isSubmitting}
        >
          {loading || isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>수정하기</Text>
          )}
        </TouchableOpacity>
      )}

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
  editButton: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    width: scale(50),
    alignItems: 'center',
  },
  editButtonText: {
    color: '#43B546',
    fontSize: scale(14),
    fontWeight: 'bold',
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
  readOnlyInput: {
    backgroundColor: '#2A2A2A',
    borderColor: '#444444',
    borderWidth: 1,
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
  infoContainer: {
    marginTop: scale(5),
  },
  infoText: {
    color: '#999999',
    fontSize: scale(12),
    textAlign: 'right',
  },
  answerContainer: {
    marginTop: scale(20),
    backgroundColor: '#2E2E2E',
    borderRadius: scale(8),
    padding: scale(16),
    borderLeftWidth: 4,
    borderLeftColor: '#43B546',
  },
  answerLabel: {
    color: '#43B546',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(8),
  },
  answerContent: {
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(12),
  },
  answerText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    lineHeight: scale(20),
  },
  answerDate: {
    color: '#999999',
    fontSize: scale(12),
    marginTop: scale(10),
    textAlign: 'right',
  },
});

export default InquiryAppDetail; 