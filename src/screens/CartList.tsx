import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// 장바구니 아이템 타입 정의
type CartItem = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  quantity: number;
  category: string;
};

// 임시 장바구니 데이터
const initialCartItems: CartItem[] = [
  {
    id: '1',
    name: '유기농 사과 1kg',
    price: 12000,
    originalPrice: 15000,
    discount: 20,
    image: 'https://via.placeholder.com/150',
    quantity: 1,
    category: 'FOOD',
  },
  {
    id: '3',
    name: '수분 크림 50ml',
    price: 28000,
    originalPrice: 35000,
    discount: 20,
    image: 'https://via.placeholder.com/150',
    quantity: 2,
    category: 'COSMETICS',
  },
];

const CartList: React.FC = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalDiscount, setTotalDiscount] = useState<number>(0);

  // 총액 계산
  useEffect(() => {
    let amount = 0;
    let discount = 0;
    
    cartItems.forEach(item => {
      amount += item.price * item.quantity;
      discount += (item.originalPrice - item.price) * item.quantity;
    });
    
    setTotalAmount(amount);
    setTotalDiscount(discount);
  }, [cartItems]);

  // 수량 변경 핸들러
  const handleQuantityChange = (id: string, change: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return {...item, quantity: newQuantity};
        }
        return item;
      })
    );
  };

  // 항목 삭제 핸들러
  const handleRemoveItem = (id: string) => {
    Alert.alert(
      '항목 삭제',
      '선택한 상품을 장바구니에서 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          onPress: () => {
            setCartItems(prevItems => 
              prevItems.filter(item => item.id !== id)
            );
          },
          style: 'destructive',
        },
      ]
    );
  };

  // 결제하기 버튼 핸들러
  const handleCheckout = () => {
    Alert.alert(
      '주문 확인',
      `총 ${cartItems.length}개 상품, ${totalAmount.toLocaleString()}원을 결제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '결제하기',
          onPress: () => {
            Alert.alert('결제 완료', '주문이 성공적으로 완료되었습니다.');
            setCartItems([]);
          },
        },
      ]
    );
  };

  // 장바구니 아이템 렌더링
  const renderCartItem = ({item}: {item: CartItem}) => {
    return (
      <View style={styles.cartItem}>
        <Image source={{uri: item.image}} style={styles.itemImage} />
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemCategory}>
            {item.category === 'FOOD' ? '식품' : 
             item.category === 'CLOTHES' ? '의류' : 
             item.category === 'COSMETICS' ? '화장품' : '기타'}
          </Text>
          <Text style={styles.itemName}>{item.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.itemPrice}>{item.price.toLocaleString()}원</Text>
            <Text style={styles.itemOriginalPrice}>{item.originalPrice.toLocaleString()}원</Text>
            <Text style={styles.itemDiscount}>{item.discount}%</Text>
          </View>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, -1)}
            >
              <Icon name="remove" size={16} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, 1)}
            >
              <Icon name="add" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.id)}
            >
              <Icon name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const EmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cart-outline" size={60} color="#DDD" />
      <Text style={styles.emptyText}>장바구니가 비어있습니다</Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('Shopping' as never)}
      >
        <Text style={styles.shopButtonText}>쇼핑하러 가기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>장바구니</Text>
        <View style={styles.placeholder} />
      </View>

      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>상품 금액</Text>
              <Text style={styles.summaryValue}>
                {(totalAmount + totalDiscount).toLocaleString()}원
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>할인 금액</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                - {totalDiscount.toLocaleString()}원
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>결제 금액</Text>
              <Text style={styles.totalValue}>{totalAmount.toLocaleString()}원</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>
                결제하기 ({cartItems.length}개 상품)
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <EmptyCart />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  itemOriginalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  itemDiscount: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 5,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  discountValue: {
    color: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6BC46A',
  },
  checkoutButton: {
    backgroundColor: '#6BC46A',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#6BC46A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CartList; 