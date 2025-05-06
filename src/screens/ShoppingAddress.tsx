import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getMemberShippingAddressList, ShippingAddressItem } from '../api/services/memberShippingAddressService';
import { useAppSelector } from '../store/hooks';

const ShoppingAddress = ({ navigation }) => {
  const [addressesList, setAddressesList] = useState<ShippingAddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await getMemberShippingAddressList({
          mem_id: memberInfo.mem_id
        });
        
        if (response.success && response.data) {
          setAddressesList(response.data);
        } 
      } catch (error) {
        console.error('배송지 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAddresses();
  }, []);

  return (
    <>
      <CommonHeader 
        title="배송지 관리"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        <TouchableOpacity style={styles.addContainer} onPress={() => navigation.navigate('ShoppingAddressAdd')}>
          <Text style={styles.addText}>배송지 추가</Text>
        </TouchableOpacity>
        {addressesList.length > 0 ? (
          <View>
            {addressesList.map((address) => (
              <View key={address.shipping_address_id}>
                <Text>{address.shipping_address_name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Image 
              source={IMAGES.icons.xDocumentGray}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>배송지가 없어요</Text>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(16),
    backgroundColor: '#FFFFFF',
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: scale(15),
  },
  addText: {
    fontSize: scale(12),
    color: '#202020',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyIcon: {
    width: scale(50),
    height: scale(50),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(14),
    color: '#CBCBCB',
    marginTop: scale(10),
  }
});

export default ShoppingAddress; 