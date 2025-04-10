import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import {getProductAppList, getProductAppThumbnailImg, Product as ProductType} from '../api/services/productAppService';
import {getMemberReviewAppList} from '../api/services/memberReviewAppService';
import BannerImagePicker from '../components/BannerImagePicker';
import {supabase} from '../utils/supabaseClient';
import IMAGES from '../utils/images';

// Define navigation type
type RootStackParamList = {
  ShoppingMain: undefined;
  ShoppingDetail: {product: ProductType};
  CartScreen: undefined;
};

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShoppingMain'>;

const ProductItem = ({item, onPress, thumbnailData, reviewData}: {item: ProductType; onPress: (item: ProductType) => void; thumbnailData: any; reviewData: any}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // 썸네일 데이터에서 현재 상품과 일치하는 이미지 정보 찾기
  const thumbnailItem = thumbnailData?.find(thumb => thumb.product_app_id === item.product_app_id);
  
  // 리뷰 데이터에서 현재 상품의 리뷰 찾기
  const productReviews = reviewData?.filter(review => review.product_app_id === item.product_app_id) || [];
  const reviewCnt = productReviews.length;
  
  // 리뷰 평균 평점 계산
  const avgStarPointRaw = productReviews.length > 0 
    ? (productReviews.reduce((sum, review) => sum + review.star_point, 0) / productReviews.length)
    : 0;
  
  // 소수점 처리: 소수점이 .0으로 끝나면 정수로, 아니면 소수점 첫째자리까지만 표시
  const avgStarPoint = avgStarPointRaw % 1 === 0 
    ? avgStarPointRaw.toFixed(0) 
    : avgStarPointRaw.toFixed(1);
  
  // Supabase URL 생성
  const getSupabaseImageUrl = () => {
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
  
  const imageUrl = getSupabaseImageUrl();
  return (
    <TouchableOpacity style={styles.productItem} onPress={() => onPress(item)}>
      <View style={styles.imageContainer}>
        <Image 
          source={{uri: imageUrl}} 
          style={[
            styles.productImage, 
            {backgroundColor: '#EEEEEE'}
          ]} 
          onError={() => setImageError(true)} 
        />
        <TouchableOpacity
          style={styles.favoriteButton} 
          onPress={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
        >
          <Icon 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={25} 
            color={isFavorite ? "#F04D4D" : "#F04D4D"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
        {item.discount > 0 && (
          <Text style={styles.originalPrice}>{item.original_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원</Text>
        )}
        <View style={styles.priceContainer}>
          {item.discount > 0 && (
            <Text style={styles.discount}>{item.discount}%</Text>
          )}
          <Text style={styles.price}>{Math.round(item.original_price * (1 - item.discount/100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원</Text>
        </View>
        {productReviews.length > 0 && (
          <View style={styles.ratingContainer}>
            <Image source={IMAGES.icons.starYellow} style={styles.starIcon} />
            <Text style={styles.avgStarPoint}>{avgStarPoint}</Text>
            <Text style={styles.reviewCnt}>후기 {reviewCnt}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ShoppingList: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState('FOOD');
  const [products, setProducts] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailData, setThumbnailData] = useState<any>(null);
  const [reviewData, setReviewData] = useState<any>(null);

  useEffect(() => {
    const fetchThumbnailData = async () => {
      try {
        const response = await getProductAppThumbnailImg();
        setThumbnailData(response.data);
      } catch (error) {
        console.error('썸네일 데이터 로드 오류:', error);
      }
    };
    
    fetchThumbnailData();
  }, []);

  // 리뷰 데이터를 화면에 진입할 때마다 갱신
  useFocusEffect(
    useCallback(() => {
      const fetchReviewData = async () => {
        try {
          const response = await getMemberReviewAppList();
          setReviewData(response.data);
          console.log('리뷰 데이터:', response.data);
        } catch (error) {
          console.error('리뷰 데이터 로드 오류:', error);
        }
      };
      
      fetchReviewData();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [selectedCategory, reviewData])
  );

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProductAppList({
        big_category: selectedCategory
      });
      if (response.success) {
        console.log('상품 로드 성공:', response.data);

        // 리뷰 데이터를 기반으로 상품의 리뷰 수 업데이트
        let updatedProducts = response.data || [];
        
        if (reviewData) {
          updatedProducts = updatedProducts.map(product => {
            // 이 상품에 대한 리뷰 개수 계산
            
            // 리뷰 개수가 있으면 comments 필드 업데이트
            return {
              ...product,
            };
          });
        }
        
        setProducts(updatedProducts);
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

  const handleProductPress = (product: ProductType) => {
    navigation.navigate('ShoppingDetail', { product });
  };

  const handleCartPress = () => {
    navigation.navigate('CartScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.brandName}>점핑하이몰</Text>
        <View style={styles.topHeaderIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="document-text-outline" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleCartPress}>
            <Icon name="cart-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Icon name="search-outline" size={18} color="#999" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>상품을 검색해보세요</Text>
          </View>
        </View>
        
        <View style={styles.bannerContainer}>
          <BannerImagePicker bannerLocate="SHOP" style={styles.banner} />
        </View>

        <View style={styles.header}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoriesContainer}
          >
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'FOOD' && styles.selectedCategory]} 
              onPress={() => setSelectedCategory('FOOD')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'FOOD' && styles.selectedCategoryText]}>식품</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'CLOTHES' && styles.selectedCategory]} 
              onPress={() => setSelectedCategory('CLOTHING')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'CLOTHES' && styles.selectedCategoryText]}>의류</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'COSMETICS' && styles.selectedCategory]} 
              onPress={() => setSelectedCategory('COSMETICS')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'COSMETICS' && styles.selectedCategoryText]}>화장품</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            renderItem={({item}) => <ProductItem item={item} onPress={handleProductPress} thumbnailData={thumbnailData || []} reviewData={reviewData || []} />}
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
    paddingHorizontal: scale(4),
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
  },
  categoriesContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  categoryButton: {
    paddingVertical: scale(4),
    flex: 1,
    width: '33.33%',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D9D9D9',
    paddingBottom: scale(8),
  },
  selectedCategory: {
    borderBottomWidth: 2,
    borderBottomColor: '#43B546',
  },
  categoryText: {
    fontSize: scale(16),
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#6BC46A',
    fontWeight: 'bold',
  },
  bannerContainer: {
    width: '100%',
    maxHeight: scale(200),
    borderBottomWidth: scale(30),
    borderBottomColor: '#D9D9D9',
    marginTop: -scale(5),
  },
  banner: {
    width: '100%',
    height: '100%',
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
  productItem: {
    width: '48%',
    marginBottom: scale(16),
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
    borderRadius: scale(8),
    backgroundColor: '#EEEEEE',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'transparent',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: scale(12),
    color: '#CBCBCB',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: scale(14),
    color: '#FF3B30',
    fontWeight: 'bold',
    marginRight: scale(8),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
  },
  avgStarPoint: {
    fontSize: scale(12),
    marginLeft: scale(4),
    marginRight: scale(8),
  },
  reviewCnt: {
    fontSize: scale(12),
    color: '#848484',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
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
});

export default ShoppingList; 