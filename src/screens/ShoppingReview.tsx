import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { getTargetMemberReviewAppList, Review } from '../api/services/memberReviewAppService';
import { getMemberOrderAppList, MemberOrderAppItem } from '../api/services/memberOrderAppService';
import { useAppSelector } from '../store/hooks';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';

// 네비게이션 타입 정의
type RootStackParamList = {
  ShoppingHome: undefined;
  ShoppingReviewModify: {
    reviewAppId?: number;
    productAppId: number;
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
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');
  const [memberReviewAppList, setMemberReviewAppList] = useState<Review[]>([]);
  const [memberOrderAppList, setMemberOrderAppList] = useState<MemberOrderAppItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  useEffect(() => {
    if (activeTab === 'list' && memberInfo?.mem_id) {
      fetchMemberReviewAppList();
    } else if (activeTab === 'write' && memberInfo?.mem_id) {
      fetchMemberOrderAppList();
    }
  }, [activeTab, memberInfo?.mem_id]);

  const fetchMemberReviewAppList = async () => {
    if (!memberInfo?.mem_id) return;
    
    setLoading(true);
    
    try {
      const response = await getTargetMemberReviewAppList({ mem_id: Number(memberInfo.mem_id) } as any);
      if (response.success) {
        console.log('response.data', response.data);
        setMemberReviewAppList(response.data);
      } else {
        console.log('response.message', response.message);
      }
    } catch (err: any) {
      console.log('err', err);
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
        setMemberOrderAppList(response.data);
      } else {
        console.log('주문 목록 조회 실패:', response.message);
      }
    } catch (err: any) {
      console.log('주문 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const homeIcon = (
    <TouchableOpacity 
      style={styles.homeBtn}
      onPress={() => navigation.navigate('ShoppingHome')}
    >
      <Image source={IMAGES.icons.homeStrokeBlack} style={styles.homeIcon} />
    </TouchableOpacity>
  );

  return (
    <>
      <CommonHeader 
        title="리뷰"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
        rightIcon={homeIcon}
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
              {loading ? (
                <ActivityIndicator size="large" color="#43B546" style={styles.loader} />
              ) : !memberOrderAppList || memberOrderAppList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Image source={IMAGES.icons.reviewGray} style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>리뷰할 상품이 없어요</Text>
                </View>
              ) : (
                <FlatList
                  data={memberOrderAppList}
                  keyExtractor={(item, index) => `${item.product_app_id}`}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.orderItem}>
                      <Text style={styles.orderDateText}>주문일자 {item?.order_dt}</Text>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                        <ShoppingThumbnailImg 
                          productAppId={item?.product_app_id || 0}
                          width={scale(80)} 
                          height={scale(80)}
                          style={styles.thumbnailImage}
                        />
                        <View style={{flexDirection: 'column',paddingVertical: scale(9),marginLeft: scale(4), justifyContent: 'space-between', alignSelf:'stretch'}}>
                          <Text style={styles.productName}>{item.brand_name}</Text>
                          <Text style={styles.productTitle}>{item.product_title}</Text>
                          <Text style={styles.productInfo}>{item.product_name} {item.option_amount}{item.option_type == 'WEIGHT' ? 'KG' : item.option_type == 'SIZE' ? item.option_type : ''} / {item.order_quantity}개</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.writeReviewBtn}
                        onPress={() => {
                          navigation.navigate('ShoppingReviewModify', {
                            productAppId: item.product_app_id,
                            productName: item.product_name,
                            brandName: item.brand_name,
                            productTitle: item.product_title,
                            optionType: item.option_type,
                            optionQuantity: item.order_quantity,
                            optionAmount: item.option_amount
                          });
                          console.log('리뷰 쓰기', item);
                        }}
                      >
                        <Text style={styles.writeReviewBtnText}>리뷰 쓰기</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>
          ) : (
            <View style={styles.reviewListContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#43B546" style={styles.loader} />
              ) : !memberReviewAppList ? (
                <View style={styles.emptyContainer}>
                  <Image source={IMAGES.icons.reviewGray} style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>내가 쓴 리뷰가 없어요</Text>
                </View>
              ) : (
                <FlatList
                  data={memberReviewAppList}
                  keyExtractor={(item) => item.review_app_id.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.reviewItem}>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                        <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-start'}}>
                          <ShoppingThumbnailImg 
                            productAppId={item?.product_app_id || 0}
                            width={scale(80)} 
                            height={scale(80)}
                            style={styles.thumbnailImage}
                          />
                          <View>
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
                          style={styles.editBtn}
                          onPress={() => {
                            navigation.navigate('ShoppingReviewModify', {
                              reviewAppId: item.review_app_id,
                              productAppId: item.product_app_id,
                              productName: item.product_name,
                              brandName: item.brand_name,
                              content: item.content,
                              starPoint: item.star_point,
                              reviewTitle: item.review_title
                            });
                          }}
                        >
                          <Text style={styles.editBtnText}>수정</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{marginTop: scale(10)}}>
                        <Text style={styles.reviewTitle}>{item.review_title}</Text>
                        <Text style={styles.reviewContent}>{item.content}</Text>
                      </View>
                    </View>
                  )}
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
    color: '#202020',
  },
  activeTabButtonText: {
    color: '#202020',
    fontWeight: '600',
    fontSize: scale(16),
  },
  loader: {
    marginTop: scale(30),
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
    fontWeight: '600',
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
    color: '#D9D9D9',
    marginLeft: scale(4),
  },
  productName: {
    fontSize: scale(12),
    color: '#202020',
    fontWeight: '600',
  },
  productTitle: {
    fontSize: scale(12),
    color: '#202020',
  },
  productInfo: {
    fontSize: scale(12),
    color: '#848484',
  },
  editBtn: {
    backgroundColor: '#202020',
    paddingHorizontal: scale(16),
    paddingVertical: scale(6),
    borderRadius: scale(4),
  },
  editBtnText: {
    fontSize: scale(14),
    color: '#FFFFFF',
  },
  thumbnailImage: {
    marginRight: scale(10),
    borderRadius: scale(8),
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
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
});

export default ShoppingReview;
