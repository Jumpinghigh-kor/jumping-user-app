import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import {getProductAppList, Product as ProductType} from '../api/services/productAppService';
import {getCommonCodeList, CommonCode} from '../api/services/commonCodeService';
import {useAppSelector} from '../store/hooks';
import ShopBannerImgPicker from '../components/ShopBannerImgPicker';
import ProductListItem from '../components/ProductListItem';
import IMAGES from '../utils/images';

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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCategory, setProductCategory] = useState<CommonCode[]>([]);
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        const response = await getCommonCodeList({ group_code: 'PRODUCT_CATEGORY' });
        if (response.success && response.data.length > 0) {
          setProductCategory(response.data);
          // 첫 번째 카테고리를 기본값으로 설정
          setSelectedCategory(response.data[0].common_code);
        }
      } catch (error) {
        console.error('카테고리 코드 로드 오류:', error);
      }
    };
    
    fetchProductCategory();
  }, []);

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
        console.log('상품 로드 성공');

        // 상품 데이터 준비
        let updatedProducts = response.data || [];
        
        setFilteredProducts(updatedProducts);
      } else {
        Alert.alert('알림', '상품을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('상품 로드 오류:', error);
      Alert.alert('알림', '상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: ExtendedProductType) => {
    navigation.navigate('ShoppingDetail', { product });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View />
        <View style={styles.topHeaderIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={IMAGES.icons.bellStrokeBlack} style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ShoppingCart')}>
            <Image source={IMAGES.icons.documentStrokeBlack} style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ShoppingCart')}>
            <Image source={IMAGES.icons.cartStrokeBlack} style={styles.headerIcon} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* <View style={styles.searchBarContainer}>
          <TouchableOpacity 
            style={styles.searchBar} 
            onPress={() => navigation.navigate('ShoppingSearch')}
          >
            <Icon name="search-outline" size={18} color="#CBCBCB" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>상품 검색하기</Text>
          </TouchableOpacity>
        </View> */}
        
        <View style={styles.bannerContainer}>
          <ShopBannerImgPicker style={styles.banner} />
        </View>

        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryList}
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
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
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
    marginTop: scale(20),
    marginBottom: scale(10),
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
  searchBarContainer: {
    paddingHorizontal: scale(16),
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
  searchPlaceholder: {
    color: '#CBCBCB',
    fontSize: scale(14),
  },
  bannerContainer: {
    width: '100%',
    maxHeight: scale(200),
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
    bottom: scale(-4),
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
    padding: scale(16),
    paddingBottom: scale(100),
  },
  productRow: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
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
});

export default ShoppingHome;