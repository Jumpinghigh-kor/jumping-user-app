import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import {getProductAppList, Product as ProductType} from '../api/services/productAppService';
import {getCommonCodeList, CommonCode} from '../api/services/commonCodeService';
import {useAppSelector} from '../store/hooks';
import { useAuth } from '../hooks/useAuth';
import ShopBannerImgPicker from '../components/ShopBannerImgPicker';
import ProductListItem from '../components/ProductListItem';
import IMAGES from '../utils/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateSelectYn } from '../api/services/memberShippingAddressService';

// Define navigation type
type RootStackParamList = {
  ShoppingMain: undefined;
  ShoppingDetail: {product: ProductType};
  CartScreen: undefined;
  ShoppingSearch: undefined;
};

// 확장된 상품 타입 정의
interface ExtendedProductType extends ProductType {
  zzim_yn?: string | null;
  zzim_app_id?: number;
}

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShoppingMain'>;

const ShoppingHome: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const { loadMemberInfo } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCategory, setProductCategory] = useState<CommonCode[]>([]);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [smallCategory, setSmallCategory] = useState<CommonCode[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSmallCategory, setSelectedSmallCategory] = useState('');

  // 배송지 선택 상태 초기화 함수
  const resetShippingAddressSelection = async () => {
    try {
      await updateSelectYn({
        mem_id: memberInfo.mem_id,
        shipping_address_id: null,
        select_yn: 'N'
      });
    } catch (error) {
      console.error('배송지 선택 상태 초기화 실패:', error);
    }
  };
  
  // 화면이 포커스될 때마다 배너 새로고침
  useFocusEffect(
    useCallback(() => {
      setRefreshKey(prev => prev + 1);
      loadProducts();
      resetShippingAddressSelection();
      loadMemberInfo();
    }, [])
  );
  
  useFocusEffect(
    useCallback(() => {
    const fetchProductCategory = async () => {
      try {
        const response = await getCommonCodeList({ group_code: 'PRODUCT_CATEGORY' });
        if (response.success && response.data.length > 0) {
          setProductCategory(response.data);
          // 첫 번째 카테고리를 기본값으로 설정
          setSelectedCategory(response.data[0].common_code);
        }
      } catch (error) {
      }
    };
    
    fetchProductCategory();
  }, [])
  );

  useEffect(() => {
    const fetchSmallCategory = async () => {
      try {
        const groupCode = selectedCategory + '_CATEGORY';
        
        const response = await getCommonCodeList({ group_code: groupCode });
        
        if (response.success && response.data && response.data.length > 0) {
          setSmallCategory(response.data);
          // 첫 번째 소카테고리를 기본값으로 설정
          setSelectedSmallCategory(response.data[0].common_code);
        } else {
          setSmallCategory([]);
          setSelectedSmallCategory('');
        }
      } catch (error) {
        console.error('Small Category API 에러:', error);
        setSmallCategory([]);
        setSelectedSmallCategory('');
      }
    };
    
    if (selectedCategory) {
      fetchSmallCategory();
    }
  }, [selectedCategory]);
   
  // 상품 조회
  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [selectedCategory])
  );

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProductAppList({
        mem_id: memberInfo?.mem_id,
        big_category: selectedCategory
      });
      if (response.success) {
        // 상품 데이터 준비
        let updatedProducts = response.data || [];
        
        setFilteredProducts(updatedProducts);
      } else {
        Alert.alert('알림', '상품을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('알림', '상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 렌더링 완료 신호 보내기
  useEffect(() => {
    if (!loading && productCategory.length > 0) {
      // 모든 로딩이 완료되면 렌더링 완료 신호 설정
      AsyncStorage.setItem('shoppingHomeRenderComplete', 'true');
    }
  }, [loading, productCategory]);

  const handleProductPress = (product: ExtendedProductType) => {
    navigation.navigate('ShoppingDetail', { productParams: product } as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Image source={IMAGES.logo.jumpingBlack} style={styles.headerLogo} />
        </View>
        <View style={styles.topHeaderIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ShoppingNotice')}>
            <Image source={IMAGES.icons.bellStrokeBlack} style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ShoppingOrderHistory')}>
            <Image source={IMAGES.icons.documentStrokeBlack} style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ShoppingCart')}>
            <Image source={IMAGES.icons.cartStrokeBlack} style={styles.headerIcon} />
            {memberInfo?.cart_cnt && memberInfo.cart_cnt > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{memberInfo.cart_cnt}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{paddingBottom: scale(100)}}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerContainer}>
          <ShopBannerImgPicker key={refreshKey} style={styles.banner} />
        </View>

        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryList}
            alwaysBounceVertical={false}
            bounces={false}
          >
            {productCategory.map((category) => (
              <TouchableOpacity
                key={category.common_code}
                style={[
                  styles.categoryButton, 
                  selectedCategory === category.common_code && styles.selectedCategory
                ]} 
                onPress={() => setSelectedCategory(category.common_code)}
              >
                <Text 
                  style={[
                    styles.categoryText, 
                    selectedCategory === category.common_code && styles.selectedCategoryText
                  ]}
                >
                  {category.common_code_name}
                </Text>
                <View style={[selectedCategory === category.common_code && styles.selectedCategoryLine]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* 소규모 카테고리 버튼들 */}
        {smallCategory.length > 0 && (
          <View style={styles.smallCategoryContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.smallCategoryList}
            >
              {smallCategory.map((category) => (
                <TouchableOpacity
                  key={category.common_code}
                  style={[
                    styles.smallCategoryButton, 
                    selectedSmallCategory === category.common_code && styles.selectedSmallCategory
                  ]} 
                  onPress={() => setSelectedSmallCategory(category.common_code)}
                >
                  <Text 
                    style={[
                      styles.smallCategoryText, 
                      selectedSmallCategory === category.common_code && styles.selectedSmallCategoryText
                    ]}
                  >
                    {category.common_code_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : filteredProducts.length > 0 ? (
          <FlatList
            data={selectedSmallCategory === '' ? filteredProducts : filteredProducts.filter(product => product.small_category === selectedSmallCategory)}
            renderItem={({item}) => (
              <ProductListItem 
                item={item} 
                onPress={handleProductPress}
                layout="grid"
              />
            )}
            keyExtractor={item => item.product_app_id.toString()}
            style={styles.content}
            contentContainerStyle={styles.listContainer}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>상품이 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  headerLogo: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  topHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: scale(12),
  },
  bannerContainer: {
    width: '100%',
    maxHeight: scale(200),
    borderBottomWidth: scale(7),
    borderBottomColor: '#D9D9D9',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryList: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: scale(10),
    borderBottomWidth: scale(3),
    borderBottomColor: '#D9D9D9',
    paddingTop: scale(7),
  },
  categoryButton: {
    width: scale(100),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedCategoryLine: {
    position: 'absolute',
    bottom: scale(-2.7),
    left: '20%',
    right: '20%',
    height: scale(3),
    backgroundColor: '#43B546',
    borderRadius: scale(1.5),
  },
  categoryText: {
    fontSize: scale(16),
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#43B546',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(10),
  },
  productRow: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    marginTop: scale(120),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(300),
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  headerIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  smallCategoryTitle: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#202020',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    marginTop: scale(10),
  },
  smallCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallCategoryList: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    gap: scale(8),
    marginVertical: scale(12),
  },
  smallCategoryButton: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(5),
    borderRadius: scale(5),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSmallCategory: {
    backgroundColor: '#42B649',
    borderColor: '#42B649',
  },
  smallCategoryText: {
    fontSize: scale(12),
    color: '#848484',
  },
  selectedSmallCategoryText: {
    color: '#FFFFFF',
  },
  cartBadge: {
    position: 'absolute',
    top: scale(-5),
    right: scale(-5),
    backgroundColor: '#FF0000',
    borderRadius: scale(15),
    width: scale(13),
    height: scale(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: scale(8),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ShoppingHome;