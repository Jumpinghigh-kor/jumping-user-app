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
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { updateInquiry, Inquiry, deleteInquiry } from '../api/services/inquiryService';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import { formatDateYYYYMMDD, formatDateYYYYMMDDHHII } from '../utils/commonFunction';
import type { AuthStackParamList } from '../navigation/AuthStackNavigator';
import { useAppSelector } from '../store/hooks';

const MAX_TITLE_LENGTH = 20;
const MAX_CONTENT_LENGTH = 3000;

type InquiryAppDetailRouteProp = RouteProp<AuthStackParamList, 'InquiryAppDetail'>;

const InquiryAppDetail = () => {
  const navigation = useNavigation();
  const route = useRoute<InquiryAppDetailRouteProp>();
  const inquiry = route.params.inquiry as Inquiry;
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const isAnswered = !!inquiry?.answer;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inquiryType, setInquiryType] = useState('선택');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 문의 유형 목록 (표시 텍스트와 실제 값 매핑)
  const inquiryTypes = [
    { label: '어플 관련 문의', value: 'APPLICATION' },
    { label: '센터 관련 문의', value: 'FRANCHISE' }
  ];

  // 표시 텍스트를 가져오는 함수
  const getTypeLabel = (value: string) => {
    const type = inquiryTypes.find(t => t.value === value);
    return type ? type.label : '선택';
  };

  useEffect(() => {
    if (inquiry) {
      setTitle(inquiry.title);
      setContent(inquiry.content);
      setInquiryType(inquiry.inquiry_type);
      
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // 현재 라우트로 전달된 데이터를 다시 반영 (서버 재조회는 요구사항 외라 생략)
      if (inquiry) {
        setTitle(inquiry.title);
        setContent(inquiry.content);
        setInquiryType(inquiry.inquiry_type);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setPopupMessage('제목을 입력해주세요.');
      setPopupVisible(true);
      return false;
    }
    
    if (!content.trim()) {
      setPopupMessage('내용을 입력해주세요.');
      setPopupVisible(true);
      return false;
    }
    
    return true;
  };

  const handleUpdate = async () => {
    if (isSubmitting) {
      return; // 중복 클릭 방지
    }

    if (inquiryType === '선택') {
      setPopupMessage('문의 유형을 선택해주세요.');
      setPopupVisible(true);
      return false;
    }
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      
      const response = await updateInquiry({
        title: title.trim(),
        content: content.trim(),
        inquiry_type: inquiryType,
        mem_id: parseInt(memberInfo?.mem_id, 10),
        inquiry_app_id: inquiry.inquiry_app_id,
      });
      
      if (response.success) {
        setPopupMessage('문의가 수정되었습니다.');
        setPopupVisible(true);
      } else {
        setPopupMessage(response.message || '문의 수정에 실패했습니다.');
        setPopupVisible(true);
      }
    } catch (error) {
      setPopupMessage('문의 수정 중 오류가 발생했습니다.');
      setPopupVisible(true);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting) {
      return; // 중복 클릭 방지
    }
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      
      const response = await deleteInquiry({
        inquiry_app_id: inquiry.inquiry_app_id,
        mem_id: parseInt(memberInfo?.mem_id, 10),
      });
      
      if (response.success) {
        navigation.goBack();
      } else {
        setPopupMessage(response.message || '문의 삭제에 실패했습니다.');
        setPopupVisible(true);
      }
    } catch (error) {
      setPopupMessage('문의 삭제 중 오류가 발생했습니다.');
      setPopupVisible(true);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <CommonPopup
        visible={popupVisible}
        message={popupMessage}
        onConfirm={() => {
          setPopupVisible(false);
          if (popupMessage === '문의가 삭제되었습니다.') {
            navigation.goBack();
          }
        }}
      />

      <CommonPopup
        visible={showDeleteConfirm}
        message="삭제하시겠습니까?"
        type="warning"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="확인"
        cancelText="취소"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={IMAGES.icons.arrowLeftWhite} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>문의 상세</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContentContainer}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
            progressBackgroundColor="#202020"
          />
        }
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>문의 유형<Text style={{color: '#FF0000'}}> *</Text></Text>
          <TouchableOpacity 
            style={[
              styles.typeSelectorContainer,
              {borderBottomWidth: showTypeSelector ? 0 : 1, borderBottomLeftRadius : showTypeSelector ? 0 : 8, borderBottomRightRadius: showTypeSelector ? 0 : 8},
              isAnswered && styles.disabledOpacity
            ]}
            onPress={() => setShowTypeSelector(!showTypeSelector)}
            disabled={isAnswered}
          >
            <Text style={styles.typeSelectorText}>{getTypeLabel(inquiryType)}</Text>
            <Image 
              source={IMAGES.icons.arrowDownGray} 
              style={[styles.typeSelectorArrow, showTypeSelector && styles.typeSelectorArrowRotated]}
            />
          </TouchableOpacity>
          
          {showTypeSelector && !isAnswered && (
            <View style={styles.typeDropdown}>
              {inquiryTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.typeDropdownItem,
                    index === 0 && styles.typeDropdownItemFirst,
                    index === inquiryTypes.length - 1 && styles.typeDropdownItemLast
                  ]}
                  onPress={() => {
                    setInquiryType(type.value);
                    setShowTypeSelector(false);
                  }}
                >
                  <Text style={[
                    styles.typeDropdownText,
                    inquiryType === type.value && styles.typeDropdownTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.label}>문의 제목<Text style={{color: '#FF0000'}}> *</Text></Text>
            <Text style={styles.dateText}>{formatDateYYYYMMDDHHII(inquiry.reg_dt)}</Text>
          </View>
          <View style={[styles.titleInputContainer, isAnswered && styles.disabledOpacity]}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력해주세요 (20자 이내)"
              placeholderTextColor="#717171"
              maxLength={MAX_TITLE_LENGTH}
              editable={!isAnswered}
            />
            <Text style={styles.titleCounter}>
              <Text style={{color: '#4C78E0'}}>{title.length}</Text> / {MAX_TITLE_LENGTH}
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>문의 내용<Text style={{color: '#FF0000'}}> *</Text></Text>
          <TextInput
            style={[styles.contentInput, isAnswered && styles.disabledOpacity]}
            value={content}
            onChangeText={(text) => {
              if (text.length <= MAX_CONTENT_LENGTH) {
                setContent(text);
              }
            }}
            placeholder="문의 내용을 입력해주세요"
            placeholderTextColor="#717171"
            multiline
            textAlignVertical="top"
            maxLength={MAX_CONTENT_LENGTH}
            editable={!isAnswered}
          />
          <Text style={styles.counter}>
            <Text style={{color: '#4C78E0'}}>{content.length}</Text> / {MAX_CONTENT_LENGTH}
          </Text>
        </View>

        {inquiry.answer && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>답변</Text>
            <View style={styles.answerContent}>
              <Text style={styles.answerText}>{inquiry.answer}</Text>
              <Text style={styles.answerDate}>
                {formatDateYYYYMMDDHHII(inquiry.answer_dt)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomButtonContainer}>

        <TouchableOpacity 
          style={[styles.deleteButton]}
          onPress={() => setShowDeleteConfirm(true)}
          disabled={loading || isSubmitting}
        >
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, (loading || isSubmitting || inquiry.answer !== null) && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={loading || isSubmitting || inquiry.answer !== null}
        >
          <Text style={styles.submitButtonText}>수정</Text>
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: scale(16),
  },
  inquiryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    marginBottom: scale(10),
  },
  inquiryContent: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  notificationDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#FF0000',
    marginLeft: scale(5),
  },
  inquiryTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(5),
  },
  inquiryDate: {
    color: '#999999',
    fontSize: scale(10),
  },
  statusContainer: {
    borderWidth: 1,
    borderColor: '#B4B4B4',
    borderRadius: scale(20),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
  },
    statusText: {
    color: '#B4B4B4',
    fontSize: scale(12), 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999999',
    fontSize: scale(14),
  },
  createButton: {
    position: 'absolute',
    bottom: scale(20),
    right: scale(20),
    backgroundColor: '#43B546',
    width: scale(120),
    height: scale(45),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#373737',
  },
  tabButton: {
    flex: 1,
    paddingVertical: scale(10),
    alignItems: 'center',
    position: 'relative',
  },
  activeTabButton: {
    // 배경색 제거
  },
  tabButtonText: {
    color: '#848484',
    fontSize: scale(14),
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#373737',
  },
  activeTabUnderline: {
    backgroundColor: '#FFFFFF',
  },
  createInquiryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  createInquiryButton: {
    backgroundColor: '#43B546',
    width: '100%',
    height: scale(50),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  createInquiryButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: scale(16),
  },
  formContentContainer: {
    paddingBottom: scale(30),
  },
  inputContainer: {
    marginBottom: scale(20),
  },
  label: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginBottom: scale(8),
    fontWeight: 'bold',
  },
  titleInputContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#373737',
    borderRadius: scale(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  titleInput: {
    flex: 1,
    padding: scale(12),
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  titleCounter: {
    paddingRight: scale(12),
    color: '#717171',
    fontSize: scale(11),
  },
  contentInput: {
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(12),
    color: '#FFFFFF',
    fontSize: scale(12),
    minHeight: scale(200),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  counter: {
    color: '#717171',
    fontSize: scale(11),
    marginRight: scale(12),
    textAlign: 'right',
    marginTop: scale(7),
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? scale(24) : scale(16),
    paddingVertical: scale(12),
  },
  submitButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(8),
    width: '44.5%',
    paddingVertical: scale(10),
    marginLeft: scale(5),
  },
  submitButtonText: {
    color: '#F6F6F6',
    fontSize: scale(14),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#848484',
    borderRadius: scale(8),
    alignItems: 'center',
    width: '44.5%',
    paddingVertical: scale(10),
    marginRight: scale(5),
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  dateText: {
    color: '#717171',
    fontSize: scale(11),
  },
  answerContainer: {
    marginTop: scale(20),
    backgroundColor: '#2A2A2A',
    borderRadius: scale(8),
    padding: scale(12),
  },
  answerLabel: {
    color: '#FFFFFF',
    fontSize: scale(12),
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
    fontSize: scale(12),
    lineHeight: scale(18),
  },
  answerDate: {
    color: '#717171',
    fontSize: scale(11),
    marginTop: scale(8),
    textAlign: 'right',
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#373737',
    borderTopLeftRadius: scale(8),
    borderTopRightRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D9D9D9',
  },
  typeSelectorText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: '500',
  },
  typeSelectorArrow: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
    tintColor: '#717171',
  },
  typeSelectorArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  typeDropdown: {
    backgroundColor: '#373737',
    borderBottomLeftRadius: scale(8),
    borderBottomRightRadius: scale(8),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    maxHeight: scale(200),
    marginTop: -scale(5),
  },
  typeDropdownItem: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  typeDropdownItemFirst: {
    borderTopLeftRadius: scale(8),
    borderTopRightRadius: scale(8),
  },
  typeDropdownItemLast: {
    borderBottomLeftRadius: scale(8),
    borderBottomRightRadius: scale(8),
    borderBottomWidth: 0,
  },
  typeDropdownText: {
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  typeDropdownTextSelected: {
    fontWeight: 'bold',
    color: '#43B546',
  },
  disabledOpacity: {
    opacity: 0.5,
  },
});

export default InquiryAppDetail; 