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
import { updateInquiry, Inquiry, deleteInquiry } from '../api/services/inquiryService';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import { formatDateYYYYMMDD, formatDateYYYYMMDDHHII } from '../utils/commonFunction';
import type { AuthStackParamList } from '../navigation/AuthStackNavigator';
import { deleteInquiryShoppingApp, InquiryShoppingApp, updateInquiryShoppingApp } from '../api/services/inquiryShoppingAppService';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { getCommonCodeList } from '../api/services/commonCodeService';

const MAX_TITLE_LENGTH = 20;
const MAX_CONTENT_LENGTH = 3000;

type InquiryShoppingAppDetailRouteProp = RouteProp<AuthStackParamList, 'InquiryShoppingAppDetail'>;

const InquiryShoppingAppDetail = () => {
  const navigation = useNavigation();
  const route = useRoute<InquiryShoppingAppDetailRouteProp>();
  const inquiryShoppingApp = route.params.inquiryShoppingApp as InquiryShoppingApp;
  const memberInfo = useAppSelector(state => state.member.memberInfo); 
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
  const [inquiryShoppingAppType, setInquiryShoppingAppType] = useState<Array<{label: string, value: string}>>([]);

  // 표시 텍스트를 가져오는 함수
  const getTypeLabel = (value: string) => {
    const type = inquiryShoppingAppType.find(t => t.value === value);
    return type ? type.label : '쇼핑몰 문의';
  };

  // 문의 타입 목록 가져오기
  const loadInquiryTypes = async () => {
    try {
      const response = await getCommonCodeList({ group_code: 'SHOPPING_INQUIRY_TYPE' });
      if (response.success && response.data) {
        const types = response.data.map((item: any) => ({
          label: item.common_code_name,
          value: item.common_code
        }));
        setInquiryShoppingAppType(types);
      }
    } catch (error) {
      console.error('문의 타입 목록 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (inquiryShoppingApp) {
      setTitle(inquiryShoppingApp.title);
      setContent(inquiryShoppingApp.content);
      // inquiry_type이 있으면 설정, 없으면 기본값 'APPLICATION'
      setInquiryType(inquiryShoppingApp.inquiry_type || 'APPLICATION');
      
      // 답변이 있는 문의를 읽음으로 표시
      if (inquiryShoppingApp.answer) {
        markInquiryShoppingAppAsRead(inquiryShoppingApp.inquiry_shopping_app_id);
      }
    }
    loadInquiryTypes();
  }, [inquiryShoppingApp]);

  const markInquiryShoppingAppAsRead = async (inquiryId: number) => {
    try {
      const readInquiriesShoppingAppStr = await AsyncStorage.getItem('readInquiriesShoppingApp');
      let readInquiriesShoppingApp: number[] = readInquiriesShoppingAppStr ? JSON.parse(readInquiriesShoppingAppStr) : [];
      
      if (!readInquiriesShoppingApp.includes(inquiryId)) {
        readInquiriesShoppingApp.push(inquiryId);
        await AsyncStorage.setItem('readInquiriesShoppingApp', JSON.stringify(readInquiriesShoppingApp));
      }
    } catch (error) {
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
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      
      const response = await updateInquiryShoppingApp({
        title: title.trim(),
        content: content.trim(),
        inquiry_type: inquiryType,
        mem_id: parseInt(memberInfo?.mem_id, 10),
        inquiry_shopping_app_id: inquiryShoppingApp.inquiry_shopping_app_id,
      });
      
      if (response.success) {
        setPopupMessage('문의가 수정되었습니다.');
        setPopupVisible(true);
      } else {
        setPopupMessage(response.message || '문의 수정에 실패했습니다.');
        setPopupVisible(true);
      }
    } catch (error: any) {
      console.error(error.response.data.message);
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
      
      const response = await deleteInquiryShoppingApp({
        inquiry_shopping_app_id: inquiryShoppingApp.inquiry_shopping_app_id,
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
        backgroundColor="#FFFFFF"
        textColor="#202020"
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
        backgroundColor="#FFFFFF"
        textColor="#202020"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="확인"
        cancelText="취소"
      />

      <CommonHeader 
        title="문의 상세"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>문의 유형<Text style={{color: '#FF0000'}}> *</Text></Text>
          <TouchableOpacity 
            style={[styles.typeSelectorContainer, {borderBottomWidth: showTypeSelector ? 0 : 1, borderBottomLeftRadius : showTypeSelector ? 0 : 8, borderBottomRightRadius: showTypeSelector ? 0 : 8}]}
            onPress={() => setShowTypeSelector(!showTypeSelector)}
          >
            <Text style={styles.typeSelectorText}>{getTypeLabel(inquiryType)}</Text>
            <Image 
              source={IMAGES.icons.arrowDownGray} 
              style={[styles.typeSelectorArrow, showTypeSelector && styles.typeSelectorArrowRotated]}
            />
          </TouchableOpacity>
          
          {showTypeSelector && (
            <View style={styles.typeDropdown}>
              {inquiryShoppingAppType.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.typeDropdownItem,
                    index === 0 && styles.typeDropdownItemFirst,
                    index === inquiryShoppingAppType.length - 1 && styles.typeDropdownItemLast
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
            <Text style={styles.dateText}>{formatDateYYYYMMDDHHII(inquiryShoppingApp.reg_dt)}</Text>
          </View>
          <View style={styles.titleInputContainer}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력해주세요 (20자 이내)"
              placeholderTextColor="#717171"
              maxLength={MAX_TITLE_LENGTH}
            />
            <Text style={styles.titleCounter}>
              <Text style={{color: '#4C78E0'}}>{title.length}</Text> / {MAX_TITLE_LENGTH}
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>문의 내용<Text style={{color: '#FF0000'}}> *</Text></Text>
          <TextInput
            style={styles.contentInput}
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
          />
          <Text style={styles.counter}>
            <Text style={{color: '#4C78E0'}}>{content.length}</Text> / {MAX_CONTENT_LENGTH}
          </Text>
        </View>

        {inquiryShoppingApp.answer && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>답변</Text>
            <View style={styles.answerContent}>
              <Text style={styles.answerText}>{inquiryShoppingApp.answer}</Text>
              <Text style={styles.answerDate}>
                {formatDateYYYYMMDDHHII(inquiryShoppingApp.answer_dt)}
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
          style={[styles.submitButton, (loading || isSubmitting || inquiryShoppingApp.answer !== null) && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={loading || isSubmitting || inquiryShoppingApp.answer !== null}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 0,
    borderBottomColor: '#333333',
    backgroundColor: '#FFFFFF',
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
    color: '#202020',
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
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
    color: '#202020',
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: scale(5),
  },
  inquiryDate: {
    color: '#202020',
    fontSize: scale(10),
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#202020',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Medium',
  },
  activeTabButtonText: {
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
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
    backgroundColor: '#202020',
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
    color: '#202020',
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
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
    color: '#202020',
    fontSize: scale(12),
    marginBottom: scale(8),
    fontFamily: 'Pretendard-SemiBold',
  },
  titleInputContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: scale(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  titleInput: {
    flex: 1,
    padding: scale(12),
    color: '#202020',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  titleCounter: {
    paddingRight: scale(12),
    color: '#717171',
    fontSize: scale(11),
    fontFamily: 'Pretendard-Regular',
  },
  contentInput: {
    backgroundColor: 'transparent',
    borderRadius: scale(8),
    padding: scale(12),
    color: '#202020',
    fontSize: scale(12),
    minHeight: scale(200),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    fontFamily: 'Pretendard-Regular',
  },
  counter: {
    color: '#717171',
    fontSize: scale(11),
    marginRight: scale(12),
    textAlign: 'right',
    marginTop: scale(7),
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Regular',
  },
  answerDate: {
    color: '#717171',
    fontSize: scale(11),
    marginTop: scale(8),
    textAlign: 'right',
    fontFamily: 'Pretendard-Regular',
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    color: '#202020',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
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
    backgroundColor: 'transparent',
    borderBottomLeftRadius: scale(8),
    borderBottomRightRadius: scale(8),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  typeDropdownItem: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
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
    color: '#202020',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  typeDropdownTextSelected: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
  },
});

export default InquiryShoppingAppDetail; 