import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  Platform,
  FlatList,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import CommonModal from '../components/CommonModal';
import { useAppSelector } from '../store/hooks';
import { getNoticesShoppingAppList, NoticeShoppingApp } from '../api/services/noticesShoppingAppService';
import { scale } from '../utils/responsive';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { createModalPanResponder } from '../utils/commonFunction';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';


const ShoppingNotice = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [notices, setNotices] = useState<NoticeShoppingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<NoticeShoppingApp | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filterModalPan = useRef(new Animated.ValueXY()).current;

  const filterModalPanResponder = useMemo(() =>
    createModalPanResponder(filterModalPan, () => setShowFilterModal(false)),
    [filterModalPan]
  );

  useEffect(() => {
    if (showFilterModal) {
      filterModalPan.setValue({ x: 0, y: 0 });
    }
  }, [showFilterModal, filterModalPan]);

  const fetchNotices = async (filterType = '') => {
    try {
      setLoading(true);
      const response = await getNoticesShoppingAppList({ notices_type: filterType });
      if (response.success) {
        setNotices(response.data);
      }
      
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // pull-to-refresh 전용 (전체 로딩 UI 없이 데이터만 갱신)
  const refreshNotices = async () => {
    try {
      const response = await getNoticesShoppingAppList({ notices_type: selectedFilter });
      if (response.success) {
        setNotices(response.data || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 무한 스크롤(8개씩)
  const { displayedItems, loadingMore, handleLoadMore } = useInfiniteScroll<NoticeShoppingApp>({
    items: notices,
    pageSize: 8,
    isLoading: loading,
    resetDeps: [selectedFilter],
  });

  // 당겨서 새로고침
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refreshNotices();
  }, [selectedFilter]);

  return (
    <>
      <CommonHeader 
        title="알림"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        <TouchableOpacity 
          style={[layoutStyle.rowEnd, commonStyle.ph16]}
          onPress={() => setShowFilterModal(true)}
        >
          <Image source={IMAGES.icons.filterBlack} style={styles.filterIcon} />
          <Text style={styles.filterText}>{selectedFilter === '' ? '전체' : selectedFilter === 'EVENT' ? '이벤트' : selectedFilter === 'NOTICE' ? '공지' : '쇼핑'}</Text>
        </TouchableOpacity>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#40B649" />
          </View>
        ) : notices?.length > 0 ? (
          <FlatList
            data={displayedItems}
            keyExtractor={(item) => String(item.notices_shopping_app_id)}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#40B649"
                colors={["#40B649"]}
                progressBackgroundColor="#FFFFFF"
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.noticeItem}
                onPress={() => {
                  setSelectedNotice(item);
                  setModalVisible(true);
                }}
              >
                <View style={styles.noticeContent}>
                  <Text style={[styles.noticeType, {color: item.notices_type === 'EVENT' ? '#FECB3D' : item.notices_type === 'GUIDE' ? '#F04D4D' : item.notices_type === 'SHOPPING' ? '#43B649' : '#202020'}]}>{item.notices_type === 'EVENT' ? '이벤트' : item.notices_type === 'NOTICE' ? '공지' : '쇼핑'}</Text>
                  <Text style={styles.noticeContent}>{item.content}</Text>
                  <Text style={styles.noticeDate}>{item.reg_dt}</Text>
                </View>
              </TouchableOpacity>
            )}
            onEndReachedThreshold={0.2}
            onEndReached={() => handleLoadMore()}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#40B649" />
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Image source={IMAGES.icons.bellGray} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>알림이 없어요</Text>
          </View>
        )}

        {/* 필터 모달 */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalOverlay}>
            <Animated.View
              style={[
                styles.filterModalContent,
                {
                  transform: [{ translateY: filterModalPan.y }]
                }
              ]}
            >
              <View
                {...filterModalPanResponder.panHandlers}
                style={styles.dragArea}
              >
                <Image source={IMAGES.icons.smallBarGray} style={styles.modalBar} />
              </View>
              
              <TouchableOpacity 
                style={styles.filterOption}
                onPress={() => {
                  setSelectedFilter('');
                  setShowFilterModal(false);
                  fetchNotices('');
                }}
              >
                <Text style={styles.filterOptionText}>전체</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterOption}
                onPress={() => {
                  setSelectedFilter('EVENT');
                  setShowFilterModal(false);
                  fetchNotices('EVENT');
                }}
              >
                <Text style={styles.filterOptionText}>이벤트</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterOption}
                onPress={() => {
                  setSelectedFilter('NOTICE');
                  setShowFilterModal(false);
                  fetchNotices('NOTICE');
                }}
              >
                <Text style={styles.filterOptionText}>공지</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterOption}
                onPress={() => {
                  setSelectedFilter('SHOPPING');
                  setShowFilterModal(false);
                  fetchNotices('SHOPPING');
                }}
              >
                <Text style={[styles.filterOptionText, {marginBottom: Platform.OS === 'ios' ? scale(30) : 0}]}>쇼핑</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        <CommonModal
          visible={modalVisible}
          title={selectedNotice?.title}
          content={selectedNotice?.content}
          onClose={() => setModalVisible(false)}
          background="#FFFFFF"
          textColor="#202020"
       />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
  },
  filterText: {
    fontSize: scale(13),
    color: '#202020',
    marginLeft: scale(4),
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
  noticeType: {
    fontSize: scale(12),
    fontWeight: '500',
    marginBottom: scale(8),
  },
  noticeContent: {
    fontSize: scale(14),
    fontWeight: '400',
    color: '#202020',
    marginBottom: scale(8),
  },
  noticeDate: {
    fontSize: scale(12),
    color: '#848484',
  },
  emptyContainer: {
    marginTop: scale(80),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scale(14),
    color: '#CBCBCB',
    fontWeight: '500',
  },
  emptyIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
    marginBottom: scale(10),
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    padding: scale(16),
    borderTopLeftRadius: scale(10),
    borderTopRightRadius: scale(10),
  },
  dragArea: {
    alignItems: 'center',
    padding: scale(16),
  },
  modalBar: {
    width: scale(40),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: '#CBCBCB',
  },
  filterOption: {
    padding: scale(16),
  },
  filterOptionText: {
    fontSize: scale(14),
    color: '#202020',
    fontWeight: 'bold',
  },
});

export default ShoppingNotice;
