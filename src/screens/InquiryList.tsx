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
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {getInquiryList, Inquiry, createInquiry} from '../api/services/inquiryService';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import {formatDateYYYYMMDD} from '../utils/commonFunctions';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const MAX_TITLE_LENGTH = 300; // varchar(300) 제한
const MAX_CONTENT_LENGTH = 1000;

const InquiryList = () => {
  const navigation = useNavigation<NavigationProp>();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [readInquiries, setReadInquiries] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'createInquiry' | 'myInquiries'>('createInquiry');
  
  // 문의하기 관련 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

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
      const response = await getInquiryList();
      if (response.success) {
        setInquiries(response.data || []);
      } else {
        Alert.alert('알림', '문의사항을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      
      Alert.alert('알림', '문의사항을 불러오는데 실패했습니다.');
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
      Alert.alert('알림', '문의 등록 중 오류가 발생했습니다.');
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

  const renderInquiryItem = ({item}: {item: Inquiry}) => (
    <TouchableOpacity style={styles.inquiryItem} onPress={() => handleInquiryPress(item)}>
      <View style={styles.inquiryContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.inquiryTitle}>{item.title}</Text>
          {item.answer && !isInquiryRead(item.inquiry_app_id) && (
            <View style={styles.notificationDot} />
          )}
        </View>
        <Text style={styles.inquiryDate}>{formatDateYYYYMMDD(item.reg_dt)}</Text>
      </View>
      <Image source={IMAGES.icons.arrowRightWhite} style={styles.arrowIcon} />
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (activeTab === 'myInquiries') {
  return (
        <>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#43B546" />
        </View>
      ) : inquiries.length > 0 ? (
        <FlatList
          data={inquiries}
          renderItem={renderInquiryItem}
          keyExtractor={(item) => item.inquiry_app_id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>등록된 문의사항이 없습니다.</Text>
        </View>
      )}
        </>
      );
    } else {
      return (
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
        </ScrollView>
      );
    }
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
        <Text style={styles.headerTitle}>문의</Text>
        <View style={styles.headerRight} />
      </View>

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
          ]}>내 문의 내역</Text>
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
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(16),
    marginBottom: scale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inquiryContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  arrowIcon: {
    width: scale(16),
    height: scale(16),
    tintColor: '#999999',
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
    backgroundColor: '#43B546',
    borderRadius: scale(8),
    padding: scale(16),
    alignItems: 'center',
    marginTop: scale(20),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default InquiryList; 