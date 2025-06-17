import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { getNoticesAppList, Notice } from '../api/services/noticesAppService';
import { scale } from '../utils/responsive';


const ShoppingNotice = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await getNoticesAppList({ notices_location: "SHOPPING" });
        if (response.success) {
          setNotices(response.data);
        }
        console.log('공지사항 응답:', response.data);
      } catch (error) {
        console.error('공지사항 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  return (
    <>
      <CommonHeader 
        title="알림"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#40B649" />
          </View>
        ) : notices.length > 0 ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {notices.map((item) => (
              <TouchableOpacity key={item.notices_app_id} style={styles.noticeItem}>
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>{item.title}</Text>
                  <Text style={styles.noticeDate}>{item.reg_dt}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>알림이 없습니다</Text>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
  },
  noticeItem: {
    borderWidth: 1,
    borderColor: '#43B546',
    borderRadius: scale(10),
    padding: scale(16),
    marginBottom: scale(12),
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: '#202020',
    marginBottom: scale(8),
  },
  noticeDate: {
    fontSize: scale(12),
    color: '#848484',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#CBCBCB',
    fontWeight: 'bold',
  },
});

export default ShoppingNotice;
