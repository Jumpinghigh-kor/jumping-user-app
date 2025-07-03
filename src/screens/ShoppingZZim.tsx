import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { getMemberZzimAppList, MemberZzimItem } from '../api/services/memberZzimAppService';
import { useAppSelector } from '../store/hooks';
import ProductListItem from '../components/ProductListItem';

// ProductType 인터페이스와 호환되도록 MemberZzimItem을 변환하는 함수
const adaptToProductType = (item: MemberZzimItem) => {
  // 타입 단언을 사용하여 MemberZzimItem 타입 체크를 우회
  const extendedItem = item as any;

  return {
    ...item,
    title: extendedItem.title || '', 
    original_price: extendedItem.original_price || 0,
    price: extendedItem.price || 0,
    discount: extendedItem.discount || 0
  };
};

const ShoppingZZim = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [zzimList, setZzimList] = useState<MemberZzimItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadZzimList = React.useCallback(async () => {
    if (!memberInfo?.mem_id) return;
    
    try {
      setLoading(true);
      const response = await getMemberZzimAppList({ mem_id: memberInfo.mem_id });
      if (response.success && response.data) {
        setZzimList(response.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [memberInfo?.mem_id]);

  useFocusEffect(
    React.useCallback(() => {
      setZzimList([]);
      setLoading(true);
      loadZzimList();
    }, [loadZzimList])
  );

  const handleProductPress = (item) => {
    navigation.navigate('ShoppingDetail', { productParams: item });
  };

  // 찜 상태가 변경되었을 때 호출되는 함수
  const handleZzimStateChange = (updatedItem) => {
    // 상태가 'N'으로 변경되면 목록에서 제거
    if (updatedItem.zzim_yn === 'N') {
      setZzimList(prevList => 
        prevList.filter(item => item.product_app_id !== updatedItem.product_app_id)
      );
    }
  };

  return (
    <>
      <CommonHeader 
        title="찜"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        <Text style={styles.title}>내가 찜한 목록</Text>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : zzimList.length > 0 ? (
          <FlatList
            data={zzimList}
            renderItem={({item}) => ( 
              <ProductListItem 
                item={adaptToProductType(item)} 
                onPress={handleProductPress} 
                layout="grid"
                onZzimPress={handleZzimStateChange}
              />
            )}
            keyExtractor={item => item.product_app_id.toString()}
            style={styles.content}
            contentContainerStyle={styles.listContainer}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="heart-outline" size={40} color="#CBCBCB" />
            <Text style={styles.emptyText}>찜한 상품이 없어요</Text>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#202020',
    marginVertical: scale(10),
    marginLeft: scale(16),
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: scale(16),
    paddingBottom: scale(60),
  },
  productRow: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyText: {
    fontSize: scale(16),
    color: '#888888',
    marginTop: scale(10),
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: scale(15),
  },
  headerIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
});

export default ShoppingZZim;
