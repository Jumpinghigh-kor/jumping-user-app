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
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {getInquiryList, Inquiry} from '../api/services/inquiryService';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import {formatDateYYYYMMDD} from '../utils/commonFunctions';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const InquiryAppList = () => {
  const navigation = useNavigation<NavigationProp>();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [readInquiries, setReadInquiries] = useState<number[]>([]);

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
      console.error('읽은 문의 로드 에러:', error);
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
      console.error('문의사항 로드 에러:', error);
      Alert.alert('알림', '문의사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryPress = (inquiry: Inquiry) => {
    if (inquiry.answer && !isInquiryRead(inquiry.inquiry_app_id)) {
      markInquiryAsRead(inquiry.inquiry_app_id);
    }
    navigation.navigate('InquiryAppDetail', { inquiry });
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
      console.error('문의 읽음 표시 에러:', error);
    }
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

  return (
    <View style={styles.container}>
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

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('InquiryAppRegister')}
      >
        <Text style={styles.createButtonText}>문의하기</Text>
      </TouchableOpacity>
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
});

export default InquiryAppList; 