import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import { getMemberShippingAddressList, ShippingAddressItem, deleteMemberShippingAddress, updateSelectYn } from '../api/services/memberShippingAddressService';
import { useAppSelector } from '../store/hooks';
import CommonPopup from '../components/CommonPopup';

const ShoppingAddress = ({ navigation, route }) => {
  const [addressesList, setAddressesList] = useState<ShippingAddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [addressIdToDelete, setAddressIdToDelete] = useState<number | null>(null);
  const params = route?.params;
  const [selectedAddressId, setSelectedAddressId] = useState(params?.shippingAddressId);

  useFocusEffect(
    useCallback(() => {
      
      const loadAddresses = async () => {
        try {
          const response = await getMemberShippingAddressList({
            mem_id: memberInfo.mem_id
          });
          
          if (response.success && response.data) {
            setAddressesList(response.data);
            
            // 기본배송지가 있으면 자동으로 선택
            const defaultAddress = response.data.find(addr => addr.default_yn === 'Y');
            if (defaultAddress) {
              // setSelectedAddressId(defaultAddress.shipping_address_id);
            }
          } 
        } catch (error) {
          
        } finally {
          setLoading(false);
        }
      };
      
      loadAddresses();
    }, [memberInfo.mem_id, route?.params])
  );
  
  const confirmDelete = (shipping_address_id: number) => {
    setAddressIdToDelete(shipping_address_id);
    setShowDeletePopup(true);
  };
  
  const handleDeleteAddress = async (shipping_address_id) => {
    try {
      const response = await deleteMemberShippingAddress({
        shipping_address_id: shipping_address_id,
        mem_id: memberInfo.mem_id
      });
      
      if (response.success) {
        // Remove from list
        const updatedList = addressesList.filter(
          item => item.shipping_address_id !== shipping_address_id
        );
        setAddressesList(updatedList);
      }
    } catch (error) {
      
    }
  };

  const handleSelectAddress = async (shipping_address_id) => {
    try {
      await updateSelectYn({
        mem_id: memberInfo.mem_id,
        shipping_address_id: shipping_address_id,
        select_yn: 'Y'
      });
      setSelectedAddressId(shipping_address_id);
    } catch (error) {
      console.error('배송지 선택 실패:', error);
    }
  };
  
  return (
    <>
      <CommonHeader 
        title="배송지 관리"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.addContainer} onPress={() => navigation.navigate('ShoppingAddressAdd')}>
          <Text style={styles.addText}>배송지 추가</Text>
        </TouchableOpacity>
        <View>
          {addressesList.length > 0 ? (
            <View>
              {addressesList.map((address) => {
                return (
                <View key={address.shipping_address_id} style={{borderBottomWidth: 5, borderColor: '#EEEEEE', paddingVertical: scale(16), paddingHorizontal: scale(16)}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: scale(5)}}>
                    <Text style={styles.addressText}>{address.shipping_address_name}</Text>
                    {address.default_yn === 'Y' && <View style={styles.defaultContainer}><Text style={styles.defaultText}>기본 배송지</Text></View>}
                  </View>
                  <Text style={styles.receiverName}>{address.receiver_name}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between'}}>
                    <View>
                      <Text style={styles.addressDetailText}>{address.address}</Text>
                      <Text style={styles.addressDetailText}>{address.address_detail}</Text>
                      <Text style={styles.phoneText}>{address.receiver_phone}</Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity 
                      style={styles.deleteContainer} 
                      onPress={() => confirmDelete(address.shipping_address_id)}
                    >
                      <Text style={styles.deleteText}>삭제</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.editContainer}
                      onPress={() => navigation.navigate('ShoppingAddressAdd', {
                        addressData: address
                      })}
                    >
                      <Text style={styles.editText}>수정</Text>
                    </TouchableOpacity>
                    {params && (
                      <TouchableOpacity 
                        style={[styles.editContainer, {backgroundColor: address?.shipping_address_id === selectedAddressId ? '#EEEEEE' : '#FFFFFF'}]}
                        disabled={address?.shipping_address_id === selectedAddressId}
                        onPress={() => handleSelectAddress(address.shipping_address_id)}
                      >
                        <Text style={[styles.editText, {color: address?.shipping_address_id === selectedAddressId ? '#848484' : '#202020'}]}>선택</Text>
                      </TouchableOpacity>
                    )}
                    </View>
                  </View>
                </View>
              )})}
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
      </ScrollView>
      
      <CommonPopup
        visible={showDeletePopup}
        message="정말 삭제하시겠습니까?"
        backgroundColor="#FFFFFF"
        textColor="#202020"
        type="warning"
        confirmText="확인"
        cancelText="취소"
        onConfirm={() => {
          setShowDeletePopup(false);
          if (addressIdToDelete !== null) {
            handleDeleteAddress(addressIdToDelete);
            setAddressIdToDelete(null);
          }
        }}
        onCancel={() => {
          setShowDeletePopup(false);
          setAddressIdToDelete(null);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: scale(16),
    backgroundColor: '#FFFFFF',
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: scale(15),
    paddingHorizontal: scale(16),
  },
  addText: {
    fontSize: scale(12),
    color: '#202020',
  },
  defaultContainer: {
    borderColor: '#42B649',
    borderWidth: 1,
    paddingHorizontal: scale(5),
    paddingVertical: scale(2),
    borderRadius: scale(20),
    marginLeft: scale(8),
  },
  defaultText: {
    fontSize: scale(10),
    color: '#202020',
  },
  receiverName: {
    fontSize: scale(14),
    color: '#202020',
    marginBottom: scale(3),
  },
  addressText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#202020',
  },
  addressDetailText: {
    fontSize: scale(12),
    color: '#202020',
  },
  phoneText: {
    marginTop: scale(5),
    fontSize: scale(12),
    color: '#202020',
  },
  deleteContainer: {
    borderColor: '#D9D9D9',
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: scale(7),
    borderRadius: scale(5),
  },
  deleteText: {
    fontSize: scale(12),
    color: '#202020',
  },
  editContainer: {
    borderColor: '#D9D9D9',
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: scale(7),
    borderRadius: scale(5),
    marginLeft: scale(5),
  },
  editText: {
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