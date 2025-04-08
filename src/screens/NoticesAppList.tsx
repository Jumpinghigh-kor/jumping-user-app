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
import {useNavigation} from '@react-navigation/native';
import {getNoticesAppList, Notice} from '../api/services/noticesAppService';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import {formatDateYYYYMMDD, formatDateYYYYMMDDHHII} from '../utils/commonFunctions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonHeader from '../components/CommonHeader';
import { FONTS } from '../utils/fonts';
import CommonModal from '../components/CommonModal';

const NoticesAppList = () => {
  const navigation = useNavigation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [readNotices, setReadNotices] = useState<number[]>([]);

  useEffect(() => {
    loadNotices();
    loadReadNotices();
  }, []);

  const loadReadNotices = async () => {
    try {
      const readNoticesStr = await AsyncStorage.getItem('readNotices');
      if (readNoticesStr) {
        setReadNotices(JSON.parse(readNoticesStr));
      }
    } catch (error) {
      
    }
  };

  const loadNotices = async () => {
    setLoading(true);
    try {
      const response = await getNoticesAppList();
      if (response.success) {
        setNotices(response.data || []);
      } else {
        Alert.alert('알림', '공지사항을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      
      Alert.alert('알림', '공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isNoticeRead = (noticeId: number): boolean => {
    return readNotices.includes(noticeId);
  };

  const markNoticeAsRead = async (noticeId: number) => {
    try {
      if (!isNoticeRead(noticeId)) {
        const newReadNotices = [...readNotices, noticeId];
        setReadNotices(newReadNotices);
        await AsyncStorage.setItem('readNotices', JSON.stringify(newReadNotices));
      }
    } catch (error) {
      
    }
  };

  const handleNoticePress = (notice: Notice) => {
    markNoticeAsRead(notice.notices_app_id);
    setSelectedNotice(notice);
    setModalVisible(true);
  };

  const renderNoticeItem = ({item}: {item: Notice}) => {
    return (
      <TouchableOpacity style={styles.noticeItem} onPress={() => handleNoticePress(item)}>
        <View style={styles.noticeContent}>
          <Text style={styles.noticeType}>{item.notices_type === 'NOTICE' ? '공지' : item.notices_type === 'EVENT' ? '이벤트' : '가이드'}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', width: scale(250)}}>
            <Text style={styles.noticeTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
            {!isNoticeRead(item.notices_app_id) && (
              <View style={styles.notificationDot} />
            )}
            </View>
          <Text style={styles.noticeDate}>{formatDateYYYYMMDD(item.reg_dt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <CommonHeader title="공지사항" />

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : notices.length > 0 ? (
          <FlatList
            data={notices}
            renderItem={renderNoticeItem}
            keyExtractor={(item) => item.notices_app_id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 공지사항이 없습니다.</Text>
          </View>
        )}

        <CommonModal
          visible={modalVisible}
          title={selectedNotice?.title || ''}
          content={selectedNotice?.content || ''}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(12),
    backgroundColor: '#202020',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: scale(16),
  },
  noticeItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingVertical: scale(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeContent: {
    flex: 1,
  },
  noticeType: {
    color: '#43B546',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Bold',
  },
  notificationDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#FF0000',
    marginLeft: scale(5),
    marginBottom: scale(15),
  },
  noticeTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginVertical: scale(5),
  },
  noticeDate: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333333',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    width: '100%',
    maxHeight: '80%',
    minHeight: '60%',
    padding: scale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: 'bold',
    flex: 1,
    paddingRight: scale(10),
  },
  closeButton: {
    padding: scale(5),
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: scale(20),
  },
  titleDivider: {
    height: 1,
    backgroundColor: '#444444',
    width: '100%',
    marginBottom: scale(15),
  },
  modalScrollView: {
    maxHeight: '90%',
    flexGrow: 1,
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    lineHeight: scale(20),
  },
  modalDate: {
    color: '#999999',
    fontSize: scale(12),
  },
  modalFooter: {
    marginTop: scale(20),
    alignItems: 'flex-end',
  },
});

export default NoticesAppList; 