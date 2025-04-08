import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
// Define navigation type
type RootStackParamList = {
  ShoppingMain: undefined;
  ShoppingDetail: {product: any};
  CartScreen: undefined;
};

const ShoppingDetail = ({route, navigation}) => {
  const {product} = route.params;

  const handleCartPress = () => {
    navigation.navigate('CartScreen');
  };

  const handleAddToCart = () => {
    // 실제 구현에서는 Context API나 Redux 등으로 장바구니 상태를 관리해야 합니다
    Alert.alert(
      '장바구니 추가',
      `"${product.name}" 상품이 장바구니에 추가되었습니다.`,
      [
        {
          text: '쇼핑 계속하기',
          style: 'cancel',
        },
        {
          text: '장바구니 보기',
          onPress: () => navigation.navigate('CartScreen'),
        },
      ]
    );
  };

  const cartIcon = (
    <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
      <Icon name="cart-outline" style={styles.cartIcon} size={24} color="#000" />
    </TouchableOpacity>
  );

  return (
    <>
      <CommonHeader 
        title=""
        backIcon={IMAGES.icons.arrowLeftBlack}
        rightIcon={cartIcon}
        backgroundColor="#FFFFFF"
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: scale(40)}}
      >

          <Image 
            source={{uri: product.image}} 
            style={styles.productImage} 
            resizeMode="cover"
          />
          
          <View style={styles.productInfo}>
            <Text style={styles.categoryLabel}>{getCategoryKoreanName(product.category)}</Text>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{product.rating}</Text>
              <Text style={styles.comments}>리뷰 {product.comments}</Text>
            </View>
            
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{product.price.toLocaleString()}원</Text>
                <View style={styles.discountContainer}>
                  <Text style={styles.originalPrice}>{product.originalPrice.toLocaleString()}원</Text>
                  <Text style={styles.discount}>{product.discount}% 할인</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>상품 정보</Text>
              <Text style={styles.description}>
                이 상품은 최고 품질의 {getCategoryKoreanName(product.category).toLowerCase()} 제품입니다. 
                다양한 용도로 사용할 수 있으며, 높은 고객 만족도를 자랑합니다.
                특별 할인 행사 중이니 지금 바로 구매해보세요!
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>리뷰 ({product.comments})</Text>
              <View style={styles.reviewSummary}>
                <View style={styles.ratingBox}>
                  <Text style={styles.ratingNumber}>{product.rating}</Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Icon 
                        key={i}
                        name={i <= Math.floor(product.rating) ? "star" : i - 0.5 <= product.rating ? "star-half" : "star-outline"} 
                        size={14} 
                        color="#FFD700" 
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewCount}>{product.comments} 리뷰</Text>
              </View>
            </View>
          </View>
        
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.wishButton}>
            <Icon name="heart-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Icon name="cart" size={18} color="#333" style={styles.buttonIcon} />
            <Text style={styles.addToCartText}>장바구니 담기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyText}>바로 구매하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

// 카테고리 한글 이름 반환 함수
const getCategoryKoreanName = (category) => {
  switch(category) {
    case 'FOOD': return '식품';
    case 'CLOTHES': return '의류';
    case 'COSMETICS': return '화장품';
    default: return '기타';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: scale(16),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  productInfo: {
    padding: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    marginRight: 10,
  },
  comments: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  discountContainer: {
    flexDirection: 'column',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  divider: {
    height: 8,
    backgroundColor: '#F5F5F5',
    marginVertical: 16,
    marginHorizontal: -16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  ratingBox: {
    alignItems: 'center',
    marginRight: 16,
  },
  ratingNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  wishButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginRight: 10,
    flexDirection: 'row',
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 5,
  },
  buttonIcon: {
    marginRight: 2,
  },
  buyButton: {
    flex: 2,
    backgroundColor: '#6BC46A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  buyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cartButton: {
    width: scale(40),
    alignItems: 'flex-end'
  },
  cartIcon: {
    // width: scale(40),
    // height: scale(40),
  },
});

export default ShoppingDetail; 