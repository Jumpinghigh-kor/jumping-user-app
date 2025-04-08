import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';

const ShoppingZZim = () => {
  const navigation = useNavigation();
  
  // 임시 더미 데이터 - 찜 목록
  const dummyFavorites = [
    {
      id: '1',
      name: '찜한 상품 1',
      price: 15000,
      discount: 10,
      image: 'https://via.placeholder.com/150',
    },
    {
      id: '2',
      name: '찜한 상품 2',
      price: 25000,
      discount: 15,
      image: 'https://via.placeholder.com/150',
    },
    {
      id: '3',
      name: '찜한 상품 3',
      price: 30000,
      discount: 5,
      image: 'https://via.placeholder.com/150',
    },
  ];

  const renderFavoriteItem = ({item}) => {
    return (
      <View style={styles.favoriteItem}>
        <Image 
          source={{uri: item.image}} 
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.discount}>{item.discount}%</Text>
            <Text style={styles.price}>
              {Math.round(item.price * (1 - item.discount/100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Icon name="heart" size={22} color="#F04D4D" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>찜 목록</Text>
        <View style={{width: 24}} />
      </View>

      {dummyFavorites.length > 0 ? (
        <FlatList
          data={dummyFavorites}
          renderItem={renderFavoriteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.favoritesList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={50} color="#CCCCCC" />
          <Text style={styles.emptyText}>찜한 상품이 없습니다.</Text>
        </View>
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
    paddingHorizontal: scale(16),
    paddingTop: scale(40),
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#000',
  },
  favoritesList: {
    padding: scale(16),
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  productImage: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(5),
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
    marginLeft: scale(15),
  },
  productName: {
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(5),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  discount: {
    fontSize: scale(14),
    color: '#FF3B30',
    fontWeight: 'bold',
    marginRight: scale(5),
  },
  favoriteButton: {
    padding: scale(10),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#888888',
    marginTop: scale(10),
  },
});

export default ShoppingZZim;
