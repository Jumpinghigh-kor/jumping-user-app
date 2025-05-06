import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Alert,
  Keyboard,
  Image,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {scale} from '../utils/responsive';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { 
  getMemberSearchAppList, 
  insertMemberSearchApp, 
  deleteMemberSearchApp,
  MemberSearch,
  getSearchProduct,
  SearchProduct
} from '../api/services/memberSearchAppService';
import IMAGES from '../utils/images';
import { getProductAppThumbnailImg } from '../api/services/productAppService';
import { supabase } from '../utils/supabaseClient';
import { getMemberReviewAppList } from '../api/services/memberReviewAppService';
import ShoppingReview from '../components/ShoppingReview';

// Navigation type
type RootStackParamList = {
  ShoppingMain: undefined;
  ShoppingDetail: {product: any};
  ShoppingSearch: undefined;
  CartScreen: undefined;
};

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ShoppingSearch: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const [recentSearches, setRecentSearches] = useState<MemberSearch[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [thumbnailData, setThumbnailData] = useState<any>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [filterType, setFilterType] = useState('추천순');

  // 최초 진입 시 검색어 목록 가져오기
  useEffect(() => {
    fetchSearchHistory();
    fetchThumbnailData();
    fetchReviewData();
  }, []);

  const fetchThumbnailData = async () => {
    try {
      const response = await getProductAppThumbnailImg();
      setThumbnailData(response.data);
    } catch (error) {
      console.error('썸네일 데이터 로드 오류:', error);
    }
  };

  const fetchSearchHistory = async () => {
    if (!memberInfo?.mem_id) return;
    
    try {
      setIsLoading(true);
      const response = await getMemberSearchAppList({
        mem_id: memberInfo.mem_id
      });
      
      if (response.success) {
        setRecentSearches(response.data || []);
      } else {
        console.error('검색어 목록 조회 실패');
      }
    } catch (error) {
      console.error('검색어 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewData = async () => {
    try {
      const response = await getMemberReviewAppList();
      setReviewData(response.data);
    } catch (error) {
      console.error('리뷰 데이터 로드 오류:', error);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };
  
  const handleSearchItemPress = (keyword: string) => {
    setSearchText(keyword);
    // 검색 실행
    handleSearch(keyword);
  };
  
  const handleDeleteSearchItem = async (search_app_id: number) => {
    if (!memberInfo?.mem_id) return;
    
    try {
      const response = await deleteMemberSearchApp({
        search_app_id,
        mem_id: memberInfo.mem_id
      });
      
      if (response.success) {
        // 삭제된 항목을 제외한 검색어 목록 업데이트
        setRecentSearches(prev => 
          prev.filter(item => item.search_app_id !== search_app_id)
        );
      } else {
        Alert.alert('알림', '검색어 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('검색어 삭제 오류:', error);
      Alert.alert('알림', '검색어 삭제 중 오류가 발생했습니다.');
    }
  };
  
  const clearAllSearches = async () => {
    if (!memberInfo?.mem_id || recentSearches.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // 모든 검색어 삭제 (순차적으로 수행)
      const deletePromises = recentSearches.map(item => 
        deleteMemberSearchApp({
          search_app_id: item.search_app_id,
          mem_id: memberInfo.mem_id
        })
      );
      
      await Promise.all(deletePromises);
      setRecentSearches([]);
    } catch (error) {
      console.error('검색어 일괄 삭제 오류:', error);
      Alert.alert('알림', '검색어 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async (keyword?: string, filterValue?: string) => {
    const searchKeyword = keyword || searchText.trim();
    const currentFilter = filterValue || filterType;
    if (!searchKeyword || !memberInfo?.mem_id) return;
    
    try {
      setIsLoading(true);
      setIsSearched(true);
      Keyboard.dismiss();
      
      // 검색어 저장 API 호출
      const response = await insertMemberSearchApp({
        mem_id: memberInfo.mem_id,
        keyword: searchKeyword
      });
      
      if (response.success) {
        // 검색어 저장 성공 후 검색어 목록 다시 가져오기
        fetchSearchHistory();
        
        // 검색 결과 가져오기
        try {
          // 검색 타입 파라미터 추가
          const searchParams: any = {
            mem_id: memberInfo.mem_id,
            keyword: searchKeyword
          };
          
          // 추천순인 경우 search_type 파라미터 추가
          if (currentFilter === '기본순') {
            searchParams.search_type = 'search_recommend';
          }
          
          const searchResponse = await getSearchProduct(searchParams);
          
          if (searchResponse.success) {
            console.log('검색 결과:', searchResponse.data.length, '개 상품');
            setSearchResults(searchResponse.data);
            // 약간의 지연 후 로딩 상태 해제 (데이터 렌더링 완료 후)
            setTimeout(() => {
              setIsLoading(false);
            }, 300);
            return; // 여기서 함수 종료하여 finally 블록의 setIsLoading(false) 실행 방지
          } else {
            console.error('상품 검색 실패');
          }
        } catch (searchError) {
          console.error('상품 검색 오류:', searchError);
        }
      } else {
        console.error('검색어 저장 실패');
      }
      setIsLoading(false); // 오류가 발생한 경우에만 여기서 로딩 상태 해제
    } catch (error) {
      console.error('검색 오류:', error);
      Alert.alert('알림', '검색 중 오류가 발생했습니다.');
      setIsLoading(false); // 오류가 발생한 경우 로딩 상태 해제
    }
  };
  
  // 썸네일 이미지 URL 생성 함수
  const getSupabaseImageUrl = (item: SearchProduct) => {
    const thumbnailItem = thumbnailData?.find(thumb => thumb.product_app_id === item.product_app_id);
    
    if (!thumbnailItem) return item.image;
    
    // file_path와 file_name으로 이미지 경로 생성
    if (thumbnailItem.file_path && thumbnailItem.file_name) {
      const imagePath = `${thumbnailItem.file_path}/${thumbnailItem.file_name}`.replace(/^\//, '');
      const { data } = supabase.storage.from('product').getPublicUrl(imagePath);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    }

    // image_url이 있는 경우
    if (thumbnailItem.image_url) {
      // 경로만 있는 경우 Supabase URL로 변환
      if (!thumbnailItem.image_url.includes('http')) {
        const { data } = supabase.storage.from('product').getPublicUrl(thumbnailItem.image_url);
        if (data && data.publicUrl) {
          return data.publicUrl;
        }
      }
      return thumbnailItem.image_url;
    }
    
    return item.image;
  };

  // 필터 토글 함수
  const toggleFilter = () => {
    const newFilterType = filterType === '추천순' ? '기본순' : '추천순';
    setFilterType(newFilterType);
    
    // 검색 결과가 있는 경우 필터 변경 시 재검색
    if (isSearched && searchResults.length > 0) {
      handleSearch(searchText.trim(), newFilterType);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Icon name="search-outline" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="상품을 검색해보세요"
              placeholderTextColor="#CBCBCB"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
          </View>
        </View>
        
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.closeText}>닫기</Text>
        </TouchableOpacity>
      </View>
      
      {isSearched ? (
        <>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#43B546" />
              <Text style={styles.loadingText}>검색 중...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultContainer}>
              <TouchableOpacity 
                style={styles.filterContainer} 
                onPress={toggleFilter}
              >
                <Image source={IMAGES.icons.filterGray} style={styles.filterIcon} />
                <Text style={styles.filterText}>{filterType}</Text>
              </TouchableOpacity>
              <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.productItem}
                    onPress={() => navigation.navigate('ShoppingDetail', { product: item })}
                  >
                    <View style={styles.productRow}>
                      <Image 
                        source={{uri: getSupabaseImageUrl(item)}} 
                        style={styles.productImage}
                      />
                      <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.title}</Text>
                        {item.discount > 0 && (
                          <View style={styles.priceContainer}>
                            <Text style={styles.discountText}>{item.discount}%</Text>
                            <Text style={styles.originalPriceText}>
                              {item.original_price}원
                            </Text>
                          </View>
                        )}
                        <Text style={styles.priceText}>
                          {item.price}원
                        </Text>
                        
                        <Text style={styles.freeShippingText}>무료배송</Text>
                        
                        <ShoppingReview 
                          productAppId={item.product_app_id} 
                          reviewData={reviewData || []}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => item.product_app_id ? item.product_app_id.toString() : `item-${index}`}
              />
            </View>
          ) : (
            <View style={styles.noResultContainer}>
              <Image source={IMAGES.icons.searchStrokeGray} style={styles.emptyIcon} />
              <Text style={styles.noResultText}>검색 결과가 없어요</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.recentSearchHeader}>
            <Text style={styles.searchHeaderTitle}>최근 검색어</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearAllSearches}>
                <Text style={styles.clearText}>지우기</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentSearches.length > 0 ? (
            <FlatList
              data={recentSearches}
              renderItem={({ item }) => (
                <View style={styles.searchItem}>
                  <TouchableOpacity 
                    style={styles.searchItemContent}
                    onPress={() => handleSearchItemPress(item.keyword)}
                  >
                    <Text style={styles.searchItemText}>{item.keyword}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSearchItem(item.search_app_id)}
                  >
                    <Image source={IMAGES.icons.xLightGray} style={styles.deleteIcon} />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item, index) => item.search_app_id ? item.search_app_id.toString() : `search-${index}`}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Image source={IMAGES.icons.searchStrokeGray} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>최근 검색어가 없어요</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  backButton: {
    marginLeft: scale(10),
  },
  searchBarContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEEEE',
    borderRadius: scale(8),
    paddingVertical: scale(10),
    paddingHorizontal: scale(10),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(14),
    color: '#333',
    padding: 0,
  },
  recentSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  searchHeaderTitle: {
    fontSize: scale(12),
    color: '#848484',
  },
  clearText: {
    fontSize: scale(12),
    color: '#848484',
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
  },
  searchItemContent: {
    flex: 1,
  },
  searchItemText: {
    fontSize: scale(16),
    color: '#333',
  },
  deleteButton: {
    padding: scale(4),
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
  closeText: {
    color: '#333',
    fontSize: scale(14),
  },
  deleteIcon: {
    width: scale(10),
    height: scale(10),
    resizeMode: 'contain',
  },
  searchResultContainer: {
    flex: 1,
    padding: scale(16),
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: scale(15),
  },
  filterText: {
    fontSize: scale(14),
    color: '#848484',
  },
  filterIcon: {
    width: scale(12),
    height: scale(12),
    marginRight: scale(6),
    resizeMode: 'contain',
  },
  productItem: {
    padding: scale(12),
  },
  productRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(10),
    marginRight: scale(10),
    backgroundColor: '#EEEEEE',
  },
  productDetails: {
    paddingTop: scale(10),
  },
  productName: {
    fontSize: scale(14),
    color: '#202020',
    marginBottom: scale(4),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  discountText: {
    fontSize: scale(16),
    color: '#F04D4D',
    fontWeight: '500',
    marginRight: scale(8),
  },
  originalPriceText: {
    fontSize: scale(16),
    color: '#CBCBCB',
    textDecorationLine: 'line-through',
  },
  priceText: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#202020',
    marginBottom: scale(4),
  },
  freeShippingText: {
    fontSize: scale(14),
    color: '#202020',
    marginBottom: scale(4),
  },
  noResultContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(140),
  },
  noResultText: {
    fontSize: scale(16),
    color: '#CBCBCB',
    fontWeight: 'bold',
    marginTop: scale(10),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scale(10),
    fontSize: scale(14),
    color: '#666',
  },
});

export default ShoppingSearch; 