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
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import {formatDateYYYYMMDD} from '../utils/commonFunction';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import CustomToast from '../components/CustomToast';
import { getInquiryShoppingAppList, InquiryShoppingApp, insertInquiryShoppingApp } from '../api/services/inquiryShoppingAppService';
import { getCommonCodeList } from '../api/services/commonCodeService';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const MAX_TITLE_LENGTH = 20; // 제목 최대 글자수 수정
const MAX_CONTENT_LENGTH = 3000; // 내용 최대 글자수 수정

const InquiryList = () => {
  const navigation = useNavigation<NavigationProp>();
  const [shoppingInquiryList, setShoppingInquiryList] = useState<InquiryShoppingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [readInquiryShoppingApp, setReadInquiryShoppingApp] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'createInquiryShoppingApp' | 'myInquiryShoppingApp'>('createInquiryShoppingApp');
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
  const [inquiryShoppingAppType, setInquiryShoppingAppType] = useState<Array<{label: string, value: string}>>([]);

  // 표시 텍스트를 가져오는 함수
  const getTypeLabel = (value: string) => {
    const type = inquiryShoppingAppType.find(t => t.value === value);
    return type ? type.label : '선택';
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

  useFocusEffect(
    React.useCallback(() => {
      loadShoppingInquiryList();
      loadReadInquiryShoppingApp();
      loadInquiryTypes();
    }, [])
  );

  const loadReadInquiryShoppingApp = async () => {
    try {
      const readInquiryShoppingAppStr = await AsyncStorage.getItem('readInquiryShoppingApp');
      if (readInquiryShoppingAppStr) {
        setReadInquiryShoppingApp(JSON.parse(readInquiryShoppingAppStr));
      }
    } catch (error) {
    
    }
  };

  const loadShoppingInquiryList = async () => {
    setLoading(true);
    try {
      const response = await getInquiryShoppingAppList({mem_id: parseInt(memberInfo.mem_id, 10)});
      if (response.success) {
        setShoppingInquiryList(response.data || []);
      } else {
        setToastMessage('문의사항을 불러오는데 실패했습니다.');
        setShowToast(true);
      }
    } catch (error: any) {
      console.log(error.response.data.message);
      setToastMessage('문의사항을 불러오는데 실패했습니다.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryPress = (inquiryShoppingApp: InquiryShoppingApp) => {
    if (inquiryShoppingApp.answer && !isInquiryRead(inquiryShoppingApp.inquiry_shopping_app_id)) {
      markInquiryAsRead(inquiryShoppingApp.inquiry_shopping_app_id);
    }
    navigation.navigate('InquiryShoppingAppDetail', { inquiryShoppingApp });
  };

  const isInquiryRead = (inquiryId: number): boolean => {
    return readInquiryShoppingApp.includes(inquiryId);
  };

  const markInquiryAsRead = async (inquiryId: number) => {
    try {
      const newReadInquiryShoppingApp = [...readInquiryShoppingApp, inquiryId];
      setReadInquiryShoppingApp(newReadInquiryShoppingApp);
      await AsyncStorage.setItem('readInquiryShoppingApp', JSON.stringify(newReadInquiryShoppingApp));
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
      
      const response = await insertInquiryShoppingApp({
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
    } catch (error: any) {
      console.error(error.response.data.message);
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
    setActiveTab('myInquiryShoppingApp');
    loadShoppingInquiryList();
  };

  const renderTabContent = () => {
    if (activeTab === 'myInquiryShoppingApp') {
    return (
      <>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : shoppingInquiryList.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
          >
            {shoppingInquiryList.map((item) => (
            <TouchableOpacity
              key={item.inquiry_shopping_app_id}
              style={styles.inquiryItem} onPress={() => handleInquiryPress(item)}
            >
              <View style={styles.inquiryContent}>
                <View style={styles.titleContainer}>
                  <View style={{flexDirection: 'row', alignItems: 'center', width: scale(200)}}>
                    <Text style={styles.inquiryTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                    {item.answer && !isInquiryRead(item.inquiry_shopping_app_id) && (
                      <View style={styles.notificationDot} />
                    )}
                  </View>
                  <Text style={styles.inquiryDate}>{formatDateYYYYMMDD(item.reg_dt)}</Text>
                </View>
              </View>
              <View style={[styles.statusContainer, {borderColor: item.answer ? '#F04D4D' : '#B4B4B4', backgroundColor: item.answer ? '#F04D4D' : ''}]}>
                <Text style={[styles.statusText, {color: item.answer ? '#202020' : '#B4B4B4'}]}>{item.answer ? '답변완료' : '접수'}</Text>
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
      <CommonHeader 
        title="쇼핑몰 문의"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />

      {/* 탭 메뉴 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'createInquiryShoppingApp' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('createInquiryShoppingApp')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'createInquiryShoppingApp' && styles.activeTabButtonText
          ]}>문의하기</Text>
          <View style={[
            styles.tabUnderline, 
            activeTab === 'createInquiryShoppingApp' && styles.activeTabUnderline
          ]} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'myInquiryShoppingApp' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('myInquiryShoppingApp')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'myInquiryShoppingApp' && styles.activeTabButtonText
          ]}>문의내역</Text>
          <View style={[
            styles.tabUnderline, 
            activeTab === 'myInquiryShoppingApp' && styles.activeTabUnderline
          ]} />
      </TouchableOpacity>
    </View>

      {renderTabContent()}

      <CommonPopup
        visible={popupVisible}
        message={popupMessage}
        onConfirm={handlePopupConfirm}
        confirmText="확인"
        backgroundColor="#FFFFFF"
        textColor="#202020"
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
    marginBottom: scale(15),
  },
  inquiryTitle: {
    color: '#202020',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(5),
  },
  inquiryDate: {
    color: '#202020',
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
  tabButtonText: {
    color: '#202020',
    fontSize: scale(14),
    fontWeight: '500',
  },
  activeTabButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
  },
  activeTabButtonText: {
    color: '#202020',
    fontWeight: 'bold',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#202020',
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
    color: '#202020',
    fontSize: scale(12),
    marginBottom: scale(8),
    fontWeight: 'bold',
  },
  titleInputContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: scale(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    height: scale(44),
  },
  titleInput: {
    flex: 1,
    padding: scale(12),
    color: '#202020',
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
    backgroundColor: 'transparent',
    borderRadius: scale(8),
    padding: scale(12),
    color: '#202020',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: scale(8),
    borderBottomRightRadius: scale(8),
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  typeDropdownItem: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  },
  typeDropdownTextSelected: {
    fontWeight: 'bold',
    color: '#202020',
  },
});

export default InquiryList; 