import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { getCompleteMemberReviewAppList, Review } from '../api/services/memberReviewAppService';
import { getMemberOrderAppList, MemberOrderAppItem } from '../api/services/memberOrderAppService';
import { useAppSelector } from '../store/hooks';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// 네비게이션 타입 정의
type RootStackParamList = {
  ShoppingHome: undefined;
  ShoppingReviewModify: {
    reviewAppId?: number;
    orderAppId: number;
    productAppId: number;
    productDetailAppId: number;
    productName: string;
    brandName: string;
    productTitle: string;
    content?: string;
    starPoint?: number;
    reviewTitle?: string;
    optionType?: string;
    optionQuantity?: number;
    optionAmount?: number;
  };
};

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ShoppingReview: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');
  const [memberReviewAppList, setMemberReviewAppList] = useState<Review[]>([]);
  const [memberOrderAppList, setMemberOrderAppList] = useState<MemberOrderAppItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  
  useFocusEffect(
    useCallback(() => {
      fetchMemberReviewAppList();
      
      if (activeTab === 'write') {
        fetchMemberOrderAppList();
      }
      
      // refresh 파라미터가 있으면 파라미터 초기화
      const params = route.params as { refresh?: boolean } | undefined;
      if (params?.refresh) {
        navigation.setParams({ refresh: undefined });
      }
    }, [activeTab, (route.params as { refresh?: boolean } | undefined)?.refresh])
  );

  useEffect(() => {
    if (activeTab === 'list' && memberInfo?.mem_id) {
      fetchMemberReviewAppList();
    } else if (activeTab === 'write' && memberInfo?.mem_id) {
      fetchMemberOrderAppList();
    }
  }, [activeTab]);

  const fetchMemberReviewAppList = async () => {
    if (!memberInfo?.mem_id) return;
    
    setLoading(true);
    
    try {
      const response = await getCompleteMemberReviewAppList({ mem_id: Number(memberInfo.mem_id) } as any);
      if (response.success) {
        setMemberReviewAppList(response.data || []);
      } else {
        setMemberReviewAppList([]);
      }
    } catch (err: any) {
      
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberOrderAppList = async () => {
    if (!memberInfo?.mem_id) return;
    
    setLoading(true);
    
    try {
      const response = await getMemberOrderAppList({
        mem_id: Number(memberInfo.mem_id),
        screen_type: 'REVIEW'
      });
      if (response.success && response.data) {
        setMemberOrderAppList(response.data || []);
      } else {
        setMemberOrderAppList([]);
      }
    } catch (err: any) {
      
    } finally {
      setLoading(false);
    }
  };
  
  // pull-to-refresh 전용 (전체 로딩 토글 없이 데이터만 갱신)
  const refreshMemberReviewAppList = async () => {
    if (!memberInfo?.mem_id) return;
    try {
      const response = await getCompleteMemberReviewAppList({ mem_id: Number(memberInfo.mem_id) } as any);
      if (response.success) {
        setMemberReviewAppList(response.data || []);
      } else {
        setMemberReviewAppList([]);
      }
    } catch (err) {}
  };

  const refreshMemberOrderAppList = async () => {
    if (!memberInfo?.mem_id) return;
    try {
      const response = await getMemberOrderAppList({
        mem_id: Number(memberInfo.mem_id),
        screen_type: 'REVIEW'
      } as any);
      if (response.success && response.data) {
        setMemberOrderAppList(response.data || []);
      } else {
        setMemberOrderAppList([]);
      }
    } catch (err) {}
  };
  
  // 무한 스크롤: 탭별 별도 관리
  const {
    displayedItems: displayedWrite,
    loadingMore: loadingMoreWrite,
    handleLoadMore: handleLoadMoreWrite,
    footerStyle: footerStyleWrite,
    contentContainerStyleEnhancer: contentContainerStyleWrite,
    handleScroll: handleScrollWrite,
  } = useInfiniteScroll<MemberOrderAppItem>({
    items: memberOrderAppList,
    pageSize: 5,
    isLoading: loading,
    resetDeps: [activeTab],
  });

  const {
    displayedItems: displayedReview,
    loadingMore: loadingMoreReview,
    handleLoadMore: handleLoadMoreReview,
    footerStyle: footerStyleReview,
    contentContainerStyleEnhancer: contentContainerStyleReview,
    handleScroll: handleScrollReview,
  } = useInfiniteScroll<Review>({
    items: memberReviewAppList,
    pageSize: 5,
    isLoading: loading,
    resetDeps: [activeTab],
  });

  // 당겨서 새로고침: 탭별 별도 관리
  const { refreshing: refreshingWrite, onRefresh: onRefreshWrite } = usePullToRefresh(async () => {
    await refreshMemberOrderAppList();
  }, [activeTab]);

  const { refreshing: refreshingReview, onRefresh: onRefreshReview } = usePullToRefresh(async () => {
    await refreshMemberReviewAppList();
  }, [activeTab]);
  
  return (
    <>
      <CommonHeader 
        title="리뷰"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        onBackPress={() => {
          navigation.navigate('ShoppingMypage');
        }}
      />
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'write' && styles.activeTabButton]}
            onPress={() => setActiveTab('write')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'write' && styles.activeTabButtonText]}>
              리뷰 쓰기
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'list' && styles.activeTabButton]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'list' && styles.activeTabButtonText]}>
              작성한 리뷰 {memberReviewAppList ? memberReviewAppList?.length : 0}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {activeTab === 'write' ? (
            <View style={styles.writeReviewContainer}>
              {!memberOrderAppList || memberOrderAppList.length === 0 ? (
                <ScrollView
                  contentContainerStyle={styles.emptyContainer}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingWrite}
                      onRefresh={onRefreshWrite}
                      tintColor="#43B546"
                      colors={["#43B546"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                >
                  <Image source={IMAGES.icons.reviewGray} style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>리뷰할 상품이 없어요</Text>
                </ScrollView>
              ) : (
                <FlatList
                  data={displayedWrite}
                  keyExtractor={(item, index) => `${item.product_app_id}`}
                  contentContainerStyle={contentContainerStyleWrite}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  alwaysBounceVertical={true}
                  ListFooterComponentStyle={footerStyleWrite}
                  onScroll={handleScrollWrite}
                  scrollEventThrottle={16}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingWrite}
                      onRefresh={onRefreshWrite}
                      tintColor="#43B546"
                      colors={["#43B546"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                  renderItem={({ item }) => (
                    <View style={styles.orderItem}>
                      <Text style={styles.orderDateText}>주문일자 {item?.order_dt}</Text>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                        <ShoppingThumbnailImg 
                          productAppId={item?.product_app_id}
                          width={scale(80)} 
                          height={scale(80)}
                        />
                        <View style={{flexDirection: 'column', marginLeft: scale(10), alignSelf: 'stretch', justifyContent: 'space-evenly', flex: 1}}>
                          <Text style={styles.productName}>{item.brand_name}</Text>
                          <Text style={styles.productTitle} numberOfLines={2} ellipsizeMode="tail">{item.product_title}</Text>
                          <Text style={styles.productInfo}>{item.product_name} {item.option_amount}{item.option_unit} / {item.order_quantity}개</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.writeReviewBtn}
                        onPress={() => {
                          navigation.navigate('ShoppingReviewModify', {
                            ...item,
                          });
                        }}
                      >
                        <Text style={styles.writeReviewBtnText}>리뷰 쓰기</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  onEndReachedThreshold={0.2}
                  onEndReached={() => handleLoadMoreWrite()}
                  ListFooterComponent={
                    (displayedWrite.length < (memberOrderAppList?.length || 0)) ? (
                      loadingMoreWrite ? (
                        <ActivityIndicator size="small" color="#43B546" />
                      ) : (
                        <View />
                      )
                    ) : null
                  }
                />
              )}
            </View>
          ) : (
            <View style={styles.reviewListContainer}>
              {memberReviewAppList || memberReviewAppList.length === 0 ? (
                <ScrollView
                  contentContainerStyle={styles.emptyContainer}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingReview}
                      onRefresh={onRefreshReview}
                      tintColor="#43B546"
                      colors={["#43B546"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
               >
                  <Image source={IMAGES.icons.reviewGray} style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>내가 쓴 리뷰가 없어요</Text>
                </ScrollView>
              ) : (
                <FlatList
                  data={displayedReview}
                  keyExtractor={(item) => item.review_app_id.toString()}
                  contentContainerStyle={contentContainerStyleReview}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  alwaysBounceVertical={true}
                  ListFooterComponentStyle={footerStyleReview}
                  onScroll={handleScrollReview}
                  scrollEventThrottle={16}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingReview}
                      onRefresh={onRefreshReview}
                      tintColor="#43B546"
                      colors={["#43B546"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                  renderItem={({ item }) => (
                    <View style={styles.reviewItem}>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                        <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-start'}}>
                          <ShoppingThumbnailImg 
                            productAppId={item?.product_app_id}
                            width={scale(80)} 
                            height={scale(80)}
                          />
                          <View style={[commonStyle.ml10]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: scale(5)}}>
                              <View style={styles.starContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <View key={star} style={styles.starIcon}>
                                    <Image 
                                      source={star <= item.star_point ? IMAGES.icons.starYellow : IMAGES.icons.starGray} 
                                      style={styles.starImage} 
                                    />
                                  </View>
                                ))}
                              </View>
                              <Text style={styles.reviewDate}>{item.reg_dt}</Text>
                            </View>
                            <Text style={styles.productInfo}>{item.brand_name} | {item.product_name}</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={[styles.editBtn, item.admin_del_yn === 'Y' && {backgroundColor: '#848484'}]}
                          disabled={item.admin_del_yn === 'Y'}
                          onPress={() => {
                            navigation.navigate('ShoppingReviewModify', {
                              ...item,
                            });
                          }}
                        >
                          <Text style={styles.editBtnText}>수정</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{marginTop: scale(10)}}>
                        <Text style={styles.reviewTitle}>{item.review_title}</Text>
                        <Text style={styles.reviewContent}>{item.content}</Text>
                        {item.admin_del_yn === 'Y' && (
                          <Text style={styles.adminText}>{item.review_img_count}관리자에 의해 삭제된 댓글입니다</Text>
                        )}
                      </View>
                    </View>
                  )}
                  onEndReachedThreshold={0.2}
                  onEndReached={() => handleLoadMoreReview()}
                  ListFooterComponent={
                    (displayedReview.length < (memberReviewAppList?.length || 0)) ? (
                      loadingMoreReview ? (
                        <ActivityIndicator size="small" color="#43B546" />
                      ) : (
                        <View />
                      )
                    ) : null
                  }
                />
              )}
            </View>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  homeBtn: {
    padding: scale(10),
  },
  homeIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    height: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#848484',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#202020',
  },
  tabButtonText: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-Regular',
    color: '#202020',
  },
  activeTabButtonText: {
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scale(16),
  },
  loader: {
    marginTop: scale(80),
  },
  contentContainer: {
    flex: 1,
  },
  writeReviewContainer: {
    flex: 1,
  },
  reviewListContainer: {
    flex: 1,
  },
  reviewItem: {
    paddingVertical: scale(20),
    paddingHorizontal: scale(16),
    marginBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  reviewTitle: {
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#202020',
  },
  reviewContent: {
    fontSize: scale(14),
    color: '#202020',
    marginTop: scale(10),
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  starIcon: {
    marginRight: scale(2),
  },
  starImage: {
    width: scale(14),
    height: scale(14),
    resizeMode: 'contain',
  },
  reviewDate: {
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    color: '#D9D9D9',
    marginLeft: scale(4),
  },
  productName: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-SemiBold',
  },
  productTitle: {
    fontSize: scale(12),
    color: '#202020',
    fontFamily: 'Pretendard-Regular',
  },
  productInfo: {
    fontSize: scale(12),
    color: '#848484',
    fontFamily: 'Pretendard-Regular',
  },
  editBtn: {
    backgroundColor: '#202020',
    paddingHorizontal: scale(16),
    paddingVertical: scale(6),
    borderRadius: scale(4),
  },
  editBtnText: {
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
    color: '#FFFFFF',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#CBCBCB',
    fontFamily: 'Pretendard-SemiBold',
    marginTop: scale(10),
  },
  orderItem: {
    paddingVertical: scale(20),
    paddingHorizontal: scale(16),
    marginBottom: scale(10),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  orderDateText: {
    fontSize: scale(14),
    color: '#202020',
    marginBottom: scale(12),
    fontFamily: 'Pretendard-Regular',
  },
  writeReviewBtn: {
    borderColor: '#43B546',
    borderWidth: 1,
    alignSelf: 'flex-end',
    paddingHorizontal: scale(16),
    paddingVertical: scale(6),
    borderRadius: scale(4),
  },
  writeReviewBtnText: {
    fontSize: scale(12),
    color: '#43B546',
    fontFamily: 'Pretendard-SemiBold',
  },
  adminText: {
    fontSize: scale(12),
    color: '#848484',
    marginTop: scale(10),
    fontFamily: 'Pretendard-Regular',
  },
  loadMoreContainer: {
    paddingVertical: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default ShoppingReview;
