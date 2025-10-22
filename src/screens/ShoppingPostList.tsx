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
import {getPostAppList, PostAppType, insertMemberPostApp, deleteMemberPostApp} from '../api/services/postAppService';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import {formatDateYYYYMMDD} from '../utils/commonFunction';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { commonStyle, layoutStyle } from '../assets/styles/common';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const ShoppingPostList = () => {
  const navigation = useNavigation<NavigationProp>();
  const [postList, setPostList] = useState<PostAppType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allPostList' | 'notReadPostList'>('allPostList');
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectAllRead, setSelectAllRead] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'warning' | 'confirm'>('confirm');
  const [popupMessage, setPopupMessage] = useState('');
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadPostList();
    }, [])
  );

  const loadPostList = async () => {
    setLoading(true);
    try {
      const response = await getPostAppList(parseInt(memberInfo.mem_id, 10), 'SHOPPING');
      if (response.success) {
        setPostList(response.data || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    const selectedIds: number[] = postList
      .filter(i => i.read_yn === 'Y' && checkedMap[i.post_app_id])
      .map(i => i.post_app_id);

    if (!selectedIds.length) {
      setPopupType('warning');
      setPopupMessage('삭제할 항목을 선택해 주세요.');
      setPendingDeleteIds([]);
      setPopupVisible(true);
      return;
    }

    setPopupType('confirm');
    setPopupMessage('정말 삭제하시겠습니까?');
    setPendingDeleteIds(selectedIds);
    setPopupVisible(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteIds.length) {
      setPopupVisible(false);
      return;
    }
    try {
      setIsSubmitting(true);
      const memId = parseInt(memberInfo.mem_id, 10);
      await deleteMemberPostApp(pendingDeleteIds, memId);
      // 즉시 UI에서 제거하여 재렌더링 유도
      setPostList(prev => prev.filter(item => !pendingDeleteIds.includes(item.post_app_id)));
      setPopupVisible(false);
      setCheckedMap({});
      setSelectAllRead(false);
      await loadPostList();
    } catch (e) {
      // noop
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderList = (dataList: PostAppType[]) => {
    return (
      <>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : dataList.length > 0 ? (
          <View style={{flex: 1}}>
            <View style={{flex: 1}}>
              <ScrollView
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                bounces={false}
                alwaysBounceVertical={false}
              >
              {activeTab === 'allPostList' && (
                <View style={styles.deleteAllContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      const next = !selectAllRead;
                      setSelectAllRead(next);
                      setCheckedMap(prev => {
                        const newMap: Record<number, boolean> = { ...prev };
                        dataList.forEach(i => {
                          if (i.read_yn === 'Y') {
                            newMap[i.post_app_id] = next;
                          }
                        });
                        return newMap;
                      });
                    }}
                    style={[styles.checkboxButton, { marginRight: scale(8) }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                    <Text style={styles.deleteAllText}>전체 삭제</Text>
                    <View style={styles.checkboxBox}>
                      {selectAllRead && <View style={styles.checkboxInner} />}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              {dataList.map((item) => (
                <TouchableOpacity
                  key={item.post_app_id}
                  style={styles.postItem} onPress={() => navigation.navigate('ShoppingPostDetail', { post: item })}
                >
                  <View style={styles.postContent}>
                    <View style={layoutStyle.rowBetween}>
                      <View style={layoutStyle.rowStart}>
                        <View style={[styles.badge, {backgroundColor: item.read_yn === 'Y' ? '#43B546' : '#D9D9D9'}]}>
                          <Text style={[styles.badgeText, {color: item.read_yn === 'Y' ? '#FFFFFF' : '#848484'}]}>{item.read_yn === 'Y' ? '읽음' : '읽지 않음'}</Text>
                        </View>
                        <Text style={styles.postTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                        {(
                          (item.post_type === 'SHOPPING' && item.read_yn === 'N') ||
                          (item.post_type === 'ALL' && (!item.read_yn || item.read_yn === 'N'))
                        ) && (
                          <View style={styles.notificationDot} />  
                        )}
                      </View>
                      {activeTab === 'allPostList' && (item.read_yn === 'Y') && (
                      <TouchableOpacity
                        onPress={() =>
                          setCheckedMap(prev => ({
                            ...prev,
                            [item.post_app_id]: !prev[item.post_app_id],
                          }))
                        }
                        style={[styles.checkboxButton, item.read_yn !== 'Y' && { opacity: 0.4 }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        disabled={item.read_yn !== 'Y'}
                      >
                        <View style={styles.checkboxBox}>
                          {checkedMap[item.post_app_id] && <View style={styles.checkboxInner} />}
                        </View>
                      </TouchableOpacity>
                      )}
                    </View>
                    <View style={[commonStyle.mt10, commonStyle.mb10]}>
                      <View style={[styles.contentRow]}>
                        <Text style={[styles.postContentText, styles.postContentInline]} numberOfLines={3} ellipsizeMode="tail">{item?.content}</Text>
                        {/* <Text style={styles.moreText}>더보기</Text> */}
                      </View>
                    </View>
                    <View style={layoutStyle.rowEnd}>
                      <Text style={styles.postDate}>{item.reg_dt}</Text>  
                    </View>
                  </View>
                </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {activeTab === 'allPostList' && (
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity 
                style={[styles.submitButton, (loading || isSubmitting) && styles.disabledButton]}
                onPress={handleDelete}
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>삭제하기</Text>
                )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Image source={IMAGES.icons.speechGray} style={styles.speechIcon} />
            <Text style={styles.emptyText}>등록된 우편이 없어요</Text>
          </View>
        )}
      </>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'allPostList') {
      return renderList(postList);
    }
    if (activeTab === 'notReadPostList') {
      const filteredList = postList.filter((item) => {
        const allSendYn = (item as any).all_send_yn;
        const readYn = item.read_yn;

        return (
          (allSendYn === 'N' && readYn === 'N') ||
          (allSendYn === 'Y' && (!readYn || readYn === ''))
        );
      });

      return renderList(filteredList);
    }
  };

  const notReadCount = postList.filter((item) => {
    const allSendYn = (item as any).all_send_yn;
    const readYn = item.read_yn;
    return (
      (allSendYn === 'N' && readYn === 'N') ||
      (allSendYn === 'Y' && (!readYn || readYn === ''))
    );
  }).length;

  return (
    <View style={styles.container}>
      <CommonHeader 
        title="우편함"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        onBackPress={() => navigation.navigate('ShoppingMypage')}
      />

      {/* 탭 메뉴 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton]}
          onPress={() => setActiveTab('allPostList')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'allPostList' && styles.activeTabButtonText
          ]}>전체</Text>
          <View style={[
            styles.tabUnderline, 
            activeTab === 'allPostList' && styles.activeTabUnderline
          ]} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton]}
          onPress={() => setActiveTab('notReadPostList')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'notReadPostList' && styles.activeTabButtonText
          ]}>읽지 않은 우편 ({notReadCount})</Text>
          <View style={[
            styles.tabUnderline, 
            activeTab === 'notReadPostList' && styles.activeTabUnderline
          ]} />
      </TouchableOpacity>
    </View>

    {renderTabContent()}
    <CommonPopup
      visible={popupVisible}
      type={popupType}
      message={popupMessage}
      backgroundColor="#FFFFFF"
      textColor="#202020"
      onConfirm={confirmDelete}
      onCancel={popupType === 'confirm' ? () => setPopupVisible(false) : undefined}
    />
    </View>
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
  listContainer: {
    padding: scale(16),
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    marginBottom: scale(10),
  },
  postContent: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderRadius: scale(10),
    padding: scale(10),
  },
  badge: {
    borderRadius: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    marginRight: scale(5),
  },
  badgeText: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-SemiBold',
  },
  postTitle: {
    color: '#202020',
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
  },
  postContentText: {
    color: '#202020',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  moreText: {
    color: '#848484',
    fontSize: scale(10),
    fontFamily: 'Pretendard-Medium',
    marginLeft: scale(2),
  },
  deleteAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: scale(8),
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteAllText: {
    color: '#202020',
    fontFamily: 'Pretendard-Medium',
    fontSize: scale(12),
    marginRight: scale(6),
  },
  deleteAllButtonIcon: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#42B649',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  postContentInline: {
    flex: 1,
  },
  postDate: {
    color: '#848484',
    fontSize: scale(10),
    fontFamily: 'Pretendard-Light',
  },
  checkboxButton: {
    marginLeft: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxIcon: {
    width: scale(18),
    height: scale(18),
    resizeMode: 'contain',
  },
  checkboxBox: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(3),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: '#42B649',
    borderColor: '#42B649',
  },
  checkboxInner: {
    flex: 1,
    borderRadius: scale(2),
    backgroundColor: '#42B649',
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
    color: '#848484',
    fontSize: scale(14),
    fontWeight: '500',
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
    backgroundColor: '#F6F6F6',
  },
  activeTabUnderline: {
    backgroundColor: '#202020',
  },
  bottomButtonContainer: {
    padding: scale(16),
    paddingBottom: Platform.OS === 'ios' ? scale(24) : scale(16),
  },
  submitButton: {
    backgroundColor: '#43B546',
    borderRadius: scale(10),
    padding: scale(10),
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scale(16),
  },
  disabledButton: {
    backgroundColor: '#848484',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(80),
  },
  emptyText: {
    color: '#848484',
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
  },
  emptyDesc: {
    color: '#848484',
    fontFamily: 'Pretendard-Regular',
    fontSize: scale(12),
    textAlign: 'center',
    marginTop: scale(10),
  },
  speechIcon: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
    marginBottom: scale(15),
  },
  notificationDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#F04D4D',
    marginLeft: scale(5),
    marginBottom: scale(15),
  },
});

export default ShoppingPostList; 