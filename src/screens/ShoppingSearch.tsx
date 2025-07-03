import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
  Modal,
  Animated,
  PanResponder
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
import { getMemberReviewAppList } from '../api/services/memberReviewAppService';
import ShoppingReview from '../components/ShoppingReview';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';

// Navigation type
type RootStackParamList = {
  ShoppingMain: undefined;
  ShoppingDetail: {product: any};
  ShoppingSearch: undefined;
  CartScreen: undefined;
};

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ShoppingSearch: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const [recentSearches, setRecentSearches] = useState<MemberSearch[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [reviewData, setReviewData] = useState<any>(null);
  const [filterType, setFilterType] = useState('new');
  const [showSortModal, setShowSortModal] = useState(false);
  const sortModalPan = useRef(new Animated.ValueXY()).current;

  // 정렬 모달 PanResponder
  const sortModalPanResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        sortModalPan.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sortModalPan.y.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          setShowSortModal(false);
        } else {
          Animated.spring(sortModalPan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            bounciness: 10,
          }).start();
        }
      },
    }),
    [sortModalPan]
  );

  // pan 애니메이션 초기화
  useEffect(() => {
    if (showSortModal) {
      sortModalPan.setValue({ x: 0, y: 0 });
    }
  }, [showSortModal, sortModalPan]);

  // 최초 진입 시 검색어 목록 가져오기
  useEffect(() => {
    fetchSearchHistory();
    fetchReviewData();
  }, []);

  const fetchSearchHistory = async () => {
    if (!memberInfo?.mem_id) return;
    
    try {
      setIsLoading(true);
      const response = await getMemberSearchAppList({
        mem_id: memberInfo.mem_id
      });
      
      if (response.success) {
        setRecentSearches(response.data || []);
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewData = async () => {
    try {
      const response = await getMemberReviewAppList();
      setReviewData(response.data);
    } catch (error) {
      
    }
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
          if (currentFilter === 'new') {
            searchParams.search_type = 'new';
          } else if (currentFilter === 'high_star') {
            searchParams.search_type = 'high_star';
          } else if (currentFilter === 'low_star') {
            searchParams.search_type = 'low_star';
          } else if (currentFilter === 'high_price') {
            searchParams.search_type = 'high_price';
          } else if (currentFilter === 'low_price') {
            searchParams.search_type = 'low_price';
          }
          
          const searchResponse = await getSearchProduct(searchParams);
          
          if (searchResponse.success) {
            setSearchResults(searchResponse.data);
            // 약간의 지연 후 로딩 상태 해제 (데이터 렌더링 완료 후)
            setTimeout(() => {
              setIsLoading(false);
            }, 300);
            return; // 여기서 함수 종료하여 finally 블록의 setIsLoading(false) 실행 방지
          } else {
            
          }
        } catch (searchError) {
          
        }
      } else {
        
      }
      setIsLoading(false); // 오류가 발생한 경우에만 여기서 로딩 상태 해제
    } catch (error) {
      
      Alert.alert('알림', '검색 중 오류가 발생했습니다.');
      setIsLoading(false); // 오류가 발생한 경우 로딩 상태 해제
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
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.closeText}>닫기</Text>
        </TouchableOpacity>
      </View>
      
      {isSearched ? (
        <>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#43B546" />
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultContainer}>
              <TouchableOpacity 
                style={styles.filterContainer} 
                onPress={() => setShowSortModal(true)}
              >
                <Image source={IMAGES.icons.filterGray} style={styles.filterIcon} />
                <Text style={styles.filterText}>{filterType === 'new' ? '최신순' : filterType === 'high_star' ? '별점높은순' : filterType === 'low_star' ? '별점낮은순' : filterType === 'high_price' ? '높은가격순' : '낮은가격순'}</Text>
              </TouchableOpacity>
              <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.productItem}
                    onPress={() => navigation.navigate('ShoppingDetail', { productParams: item })}
                  >
                    <View style={styles.productRow}>
                      <ShoppingThumbnailImg 
                        productAppId={item.product_app_id}
                        width={scale(120)} 
                        height={scale(120)}
                        borderRadius={scale(10)}
                      />
                      <View style={styles.productDetails}>
                        <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
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

      {/* 정렬 모달 */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.sortModalOverlay}>
          <Animated.View
            style={[
              styles.sortModalContent,
              {
                transform: [{ translateY: sortModalPan.y }]
              }
            ]}
          >
            <View
              {...sortModalPanResponder.panHandlers}
              style={styles.dragArea}
            >
              <Image source={IMAGES.icons.smallBarGray} style={styles.modalBar} />
            </View>
            
            <TouchableOpacity 
              style={styles.sortOption}
              onPress={() => {
                setFilterType('new');
                setShowSortModal(false);
                if (isSearched && searchResults.length > 0) {
                  handleSearch(searchText.trim(), 'new');
                }
              }}
            >
              <Text style={styles.sortOptionText}>최신순</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sortOption}
              onPress={() => {
                setFilterType('high_star');
                setShowSortModal(false);
                if (isSearched && searchResults.length > 0) {
                  handleSearch(searchText.trim(), 'high_star');
                }
              }}
            >
              <Text style={styles.sortOptionText}>별점높은순</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sortOption}
              onPress={() => {
                setFilterType('low_star');
                setShowSortModal(false);
                if (isSearched && searchResults.length > 0) {
                  handleSearch(searchText.trim(), 'low_star');
                }
              }}
            >
              <Text style={styles.sortOptionText}>별점낮은순</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sortOption}
              onPress={() => {
                setFilterType('high_price');
                setShowSortModal(false);
                if (isSearched && searchResults.length > 0) {
                  handleSearch(searchText.trim(), 'high_price');
                }
              }}
            >
              <Text style={styles.sortOptionText}>높은가격순</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sortOption}
              onPress={() => {
                setFilterType('low_price');
                setShowSortModal(false);
                if (isSearched && searchResults.length > 0) {
                  handleSearch(searchText.trim(), 'low_price');
                }
              }}
            >
              <Text style={styles.sortOptionText}>낮은가격순</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
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
    padding: scale(14),
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: scale(5),
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
  productDetails: {
    flex: 1,
    marginLeft: scale(10),
    justifyContent: 'space-evenly',
  },
  productName: {
    fontSize: scale(12),
    color: '#202020',
    marginBottom: scale(2),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(2),
  },
  discountText: {
    fontSize: scale(14),
    color: '#F04D4D',
    fontWeight: '500',
    marginRight: scale(8),
  },
  originalPriceText: {
    fontSize: scale(14),
    color: '#CBCBCB',
    textDecorationLine: 'line-through',
  },
  priceText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#202020',
    marginBottom: scale(2),
  },
  freeShippingText: {
    fontSize: scale(12),
    color: '#202020',
    marginBottom: scale(2),
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
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    width: '100%',
    maxHeight: '40%',
    minHeight: '40%',
    padding: scale(20),
  },
  dragArea: {
    width: '100%',
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -scale(10),
    marginBottom: scale(5),
  },
  modalBar: {
    width: scale(40),
    height: scale(30),
    resizeMode: 'contain',
  },
  sortOption: {
    padding: scale(15),
  },
  sortOptionText: {
    fontSize: scale(16),
    color: '#202020',
    textAlign: 'center',
  },
});

export default ShoppingSearch; 