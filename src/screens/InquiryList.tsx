import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {getInquiryList, Inquiry, insertInquiry} from '../api/services/inquiryService';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import {formatDateYYYYMMDD} from '../utils/commonFunction';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import CustomToast from '../components/CustomToast';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const MAX_TITLE_LENGTH = 20; // 제목 최대 글자수 수정
const MAX_CONTENT_LENGTH = 3000; // 내용 최대 글자수 수정

const InquiryList = () => {
  const navigation = useNavigation<NavigationProp>();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [readInquiries, setReadInquiries] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'createInquiry' | 'myInquiries'>('createInquiry');
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  // 문의하기 관련 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inquiryType, setInquiryType] = useState('선택');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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


  useFocusEffect(
    React.useCallback(() => {
      loadInquiries();
      loadReadInquiries();
    }, [])
  );

  const loadReadInquiries = async () => {
    try {
      const readInquiriesStr = await AsyncStorage.getItem('readInquiries');
      if (readInquiriesStr) {
        setReadInquiries(JSON.parse(readInquiriesStr));
      }
    } catch (error) {
    
    }
  };

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const response = await getInquiryList({mem_id: parseInt(memberInfo.mem_id, 10)});
      if (response.success) {
        setInquiries(response.data || []);
      } else {
        setToastMessage('문의사항을 불러오는데 실패했습니다.');
        setShowToast(true);
      }
    } catch (error) {
      console.log(error.response.data);
      setToastMessage('문의사항을 불러오는데 실패했습니다.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryPress = (inquiry: Inquiry) => {
    if (inquiry.answer && !isInquiryRead(inquiry.inquiry_app_id)) {
      markInquiryAsRead(inquiry.inquiry_app_id);
    }
    navigation.navigate('InquiryDetail', { inquiry });
  };

  const isInquiryRead = (inquiryId: number): boolean => {
    return readInquiries.includes(inquiryId);
  };

  const markInquiryAsRead = async (inquiryId: number) => {
    try {
      const newReadInquiries = [...readInquiries, inquiryId];
      setReadInquiries(newReadInquiries);
      await AsyncStorage.setItem('readInquiries', JSON.stringify(newReadInquiries));
    } catch (error) {
      
    }
  };

  // 문의하기 관련 함수
  const validateForm = () => {
    if (inquiryType === '선택') {
      setToastMessage('문의 유형을 선택해주세요.');
      setShowToast(true);
      return false;
    }
    
    if (!title.trim()) {
      setToastMessage('제목을 입력해주세요.');
      setShowToast(true);
      return false;
    }
    
    if (!content.trim()) {
      setToastMessage('내용을 입력해주세요.');
      setShowToast(true);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      
      if (!memberInfo?.mem_id) {
        setToastMessage('로그인이 필요합니다.');
        setShowToast(true);
        setIsSubmitting(false);
        setLoading(false);
        return;
      }
      
      const response = await insertInquiry({
        title: title.trim(),
        content: content.trim(),
        inquiry_type: inquiryType,
        mem_id: parseInt(memberInfo.mem_id, 10),
      });
      
      if (response.success) {
        setPopupMessage('문의가 등록되었습니다.');
        setPopupVisible(true);
      } else {
        setToastMessage(response.message || '문의 등록에 실패했습니다.');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('문의 등록 중 오류가 발생했습니다.');
      setShowToast(true);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handlePopupConfirm = () => {
    setPopupVisible(false);
    setTitle('');
    setContent('');
    setActiveTab('myInquiries');
    loadInquiries();
  };

  const renderTabContent = () => {
    if (activeTab === 'myInquiries') {
    return (
      <>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : inquiries.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
          >
            {inquiries.map((item) => (
            <TouchableOpacity
              key={item.inquiry_app_id}
              style={styles.inquiryItem} onPress={() => handleInquiryPress(item)}
            >
              <View style={styles.inquiryContent}>
                <View style={styles.titleContainer}>
                  <View style={{flexDirection: 'row', alignItems: 'center', width: scale(200)}}>
                    <Text style={styles.inquiryTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                    {item.answer && !isInquiryRead(item.inquiry_app_id) && (
                      <View style={styles.notificationDot} />
                    )}
                  </View>
                  <Text style={styles.inquiryDate}>{formatDateYYYYMMDD(item.reg_dt)}</Text>
                </View>
              </View>
              <View style={[styles.statusContainer, {borderColor: item.answer ? '#F04D4D' : '#B4B4B4', backgroundColor: item.answer ? '#F04D4D' : ''}]}>
                <Text style={[styles.statusText, {color: item.answer ? '#FFFFFF' : '#B4B4B4'}]}>{item.answer ? '답변완료' : '접수'}</Text>
              </View>
            </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Image source={IMAGES.icons.speechGray} style={styles.speechIcon} />
            <Text style={styles.emptyText}>등록된 문의가 없어요</Text>
            <Text style={styles.emptyDesc}>문의하기 페이지에서{'\n'}궁금한 점에 대해 문의를 남겨주세요</Text>
          </View>
        )}
      </>
    )} else {
      return (
        <>
          <View style={styles.formContainer}>
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
              <Text style={styles.label}>문의 제목<Text style={{color: '#FF0000'}}> *</Text></Text>
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
          </View>

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, (loading || isSubmitting) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading || isSubmitting}
            >
              {loading || isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>문의접수</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="문의" />

      {/* 탭 메뉴 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'createInquiry' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('createInquiry')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'createInquiry' && styles.activeTabButtonText
          ]}>문의하기</Text>
          <View style={[
            styles.tabUnderline, 
            activeTab === 'createInquiry' && styles.activeTabUnderline
          ]} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'myInquiries' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('myInquiries')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'myInquiries' && styles.activeTabButtonText
          ]}>문의내역</Text>
          <View style={[
            styles.tabUnderline, 
            activeTab === 'myInquiries' && styles.activeTabUnderline
          ]} />
      </TouchableOpacity>
    </View>

      {renderTabContent()}

      <CommonPopup
        visible={popupVisible}
        message={popupMessage}
        onConfirm={handlePopupConfirm}
        confirmText="확인"
      />

      <CustomToast
        visible={showToast}
        message={toastMessage}
        position="bottom"
        onHide={() => setShowToast(false)}
      />
    </View>
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
    backgroundColor: '#F04D4D',
    marginLeft: scale(5),
    marginBottom: scale(15),
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
    borderRadius: scale(20),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
  },
  statusText: {
    fontSize: scale(12), 
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(80),
  },
  emptyText: {
    color: '#848484',
    fontSize: scale(14),
    fontWeight: '600',
  },
  emptyDesc: {
    color: '#848484',
    fontSize: scale(12),
    textAlign: 'center',
    marginTop: scale(10),
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
    paddingBottom: scale(80),
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
    height: scale(44),
  },
  titleInput: {
    flex: 1,
    padding: scale(12),
    color: '#FFFFFF',
    fontSize: scale(12),
    height: scale(44),
    textAlignVertical: 'center',
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
  submitButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(8),
    padding: scale(12),
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#F6F6F6',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  bottomButtonContainer: {
    width: '100%',
    padding: scale(16),
    paddingBottom: Platform.OS === 'ios' ? scale(24) : scale(16),
    backgroundColor: '#202020',
  },
  speechIcon: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
    marginBottom: scale(15),
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

export default InquiryList; 