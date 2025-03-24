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
      console.error('읽은 공지사항 로드 에러:', error);
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
      console.error('공지사항 로드 에러:', error);
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
      console.error('공지사항 읽음 표시 에러:', error);
    }
  };

  const handleNoticePress = (notice: Notice) => {
    markNoticeAsRead(notice.notices_app_id);
    setSelectedNotice(notice);
    setModalVisible(true);
  };

  const renderNoticeItem = ({item}: {item: Notice}) => (
    <TouchableOpacity style={styles.noticeItem} onPress={() => handleNoticePress(item)}>
      <View style={styles.noticeContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.noticeTitle}>{item.title}</Text>
          {!isNoticeRead(item.notices_app_id) && (
            <View style={styles.notificationDot} />
          )}
        </View>
        <Text style={styles.noticeDate}>{formatDateYYYYMMDD(item.reg_dt)}</Text>
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
        <Text style={styles.headerTitle}>공지사항</Text>
        <View style={styles.headerRight} />
      </View>

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedNotice?.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.titleDivider} />
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>{selectedNotice?.content}</Text>
              <View style={styles.modalFooter}>
                <Text style={styles.modalDate}>{selectedNotice ? formatDateYYYYMMDD(selectedNotice.reg_dt) : ''}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  noticeItem: {
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(16),
    marginBottom: scale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeContent: {
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
  noticeTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(5),
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