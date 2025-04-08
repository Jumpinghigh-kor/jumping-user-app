import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';

const ShoppingSearch: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // 임시 검색 결과 데이터
  const dummyResults = [
    {
      id: '1',
      name: '검색 상품 1',
      price: 15000,
      discount: 10,
      image: 'https://via.placeholder.com/150',
    },
    {
      id: '2',
      name: '검색 상품 2',
      price: 25000,
      discount: 15,
      image: 'https://via.placeholder.com/150',
    },
    {
      id: '3',
      name: '검색 상품 3',
      price: 30000,
      discount: 5,
      image: 'https://via.placeholder.com/150',
    },
  ];

  const handleSearch = () => {
    if (searchText.trim() === '') return;
    
    setIsSearching(true);
    
    // 실제 앱에서는 API 호출이 들어갈 자리
    setTimeout(() => {
      setSearchResults(dummyResults);
      setIsSearching(false);
    }, 1000);
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchItem}
      onPress={() => navigation.navigate('ShoppingDetail', { product: item })}
    >
      <Image 
        source={{ uri: item.image }} 
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
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="상품을 검색해보세요"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Icon name="search-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#43B546" />
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.searchResults}
        />
      ) : searchText ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
        </View>
      ) : (
        <View style={styles.initialContainer}>
          <Text style={styles.initialText}>검색어를 입력해주세요</Text>
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
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: scale(40),
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: scale(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
  },
  searchInput: {
    flex: 1,
    height: scale(40),
    fontSize: scale(14),
    color: '#333',
  },
  searchButton: {
    padding: scale(8),
  },
  searchResults: {
    padding: scale(16),
  },
  searchItem: {
    flexDirection: 'row',
    marginBottom: scale(16),
    padding: scale(10),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(5),
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
    marginLeft: scale(15),
    justifyContent: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#888888',
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: scale(16),
    color: '#888888',
  },
});

export default ShoppingSearch; 