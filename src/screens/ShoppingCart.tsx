import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import CommonPopup from '../components/CommonPopup';
import { getMemberCartAppList, deleteMemberCartApp, updateMemberCartApp } from '../api/services/memberCartAppService';
import { getProductDetailAppList } from '../api/services/productAppService';
import { useAppSelector } from '../store/hooks';
import { layoutStyle, commonStyle } from '../styles/common';
import ShoppingThumbnailImg from '../components/ShoppingThumbnailImg';
import { usePopup } from '../hooks/usePopup';
import { 
  toggleSelectAll, 
  toggleSelectProductGroup, 
  getSelectedCount, 
  getTotalUniqueProductCount,
  increaseQuantity,
  decreaseQuantity
} from '../utils/commonFunction';

const ShoppingCart = () => {
  const navigation = useNavigation();
  const [cartList, setCartList] = useState([]);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [showOptions, setShowOptions] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [allSelected, setAllSelected] = useState(false);
  const [productDetailData, setProductDetailData] = useState({});
  const { popup, showWarningPopup, showConfirmPopup } = usePopup();

  const fetchCartList = async () => {
    try {
      const response = await getMemberCartAppList({
        mem_id: Number(memberInfo.mem_id)
      });
      
      if (response.success && response.data) {
        const cartData = Array.isArray(response.data) ? response.data : [response.data];
        setCartList(cartData);
        
        const initialOptions = {};
        cartData.forEach(item => {
          initialOptions[item.cart_app_id] = {
            option_gender: item.option_gender,
            option_amount: item.option_amount,
            option_unit: item.option_unit
          };
        });
        setSelectedOptions(initialOptions);
      }
    } catch (error) {
      
    } finally {
    }
  };

  
  useEffect(() => {
    fetchCartList();
  }, []);
  
  useEffect(() => {
    if (cartList.length > 0) {
      // Only consider selectable items (with non-zero quantity) for determining if all are selected
      const selectableItems = cartList.filter(item => item?.product_quantity !== 0);
      const allSelectableItemsSelected = selectableItems.length > 0 && 
        selectableItems.every(item => selectedItems[item.cart_app_id]);
      setAllSelected(allSelectableItemsSelected);
    }
  }, [selectedItems, cartList]);

  // 상품별로 그룹화
  const groupedByProductId = cartList.reduce((acc, item) => {
    if (!acc[item.product_app_id]) {
      acc[item.product_app_id] = [];
    }
    acc[item.product_app_id].push(item);
    return acc;
  }, {} as Record<string | number, any[]>);

  // x아이콘 버튼 삭제
  const handleDeletePress = (productAppId) => {
    showConfirmPopup(
      `선택하신 상품을\n장바구니에서 삭제하시겠습니까?`, 
      async () => {
        try {
          if (productAppId) {
            const itemsToDelete = cartList.filter(item => String(item.product_detail_app_id) === String(productAppId));
            
            const deletePromises = itemsToDelete.map(item => 
              deleteMemberCartApp({
                mem_id: Number(memberInfo.mem_id),
                cart_app_id: item.cart_app_id
              })
            );
            
            await Promise.all(deletePromises);
            
            const updatedCartList = cartList.filter(item => String(item.product_detail_app_id) !== String(productAppId));
            setCartList(updatedCartList);
            
            const newSelectedItems = {...selectedItems};
            itemsToDelete.forEach(item => {
              delete newSelectedItems[item.cart_app_id];
            });
            setSelectedItems(newSelectedItems);
          }
        } catch (error) {
          
          fetchCartList();
        } finally {
        }
      }
    );
  };

  // 선택 삭제
  const handleSelectDeletePress = () => {
    const hasSelectedItems = Object.values(selectedItems).some(Boolean);
    if (!hasSelectedItems) {
      showWarningPopup('삭제할 상품을 선택해주세요');
      return;
    }
    
    showConfirmPopup('선택하신 상품을\n장바구니에서 삭제하시겠습니까?', async () => {
      try {
        const selectedCartIds = Object.entries(selectedItems)
          .filter(([_, isSelected]) => isSelected)
          .map(([cartAppId]) => Number(cartAppId));
        
        const deletePromises = selectedCartIds.map(cartAppId => 
          deleteMemberCartApp({
            mem_id: Number(memberInfo.mem_id),
            cart_app_id: cartAppId
          })
        );
        
        await Promise.all(deletePromises);
        
        const updatedCartList = cartList.filter(item => !selectedItems[item.cart_app_id]);
        
        setSelectedItems({});
        setCartList(updatedCartList);
        setAllSelected(false);
      } catch (error) {
        
        fetchCartList();
      }
    });
  };

  // 상품 상세 데이터 로드
  const fetchProductDetailData = async (productAppId) => {
    try {
      const response = await getProductDetailAppList({
        product_app_id: productAppId
      });
      
      if (response.success && response.data) {
        setProductDetailData(prev => ({
          ...prev,
          [productAppId]: Array.isArray(response.data) ? response.data : [response.data]
        }));
      }
    } catch (error) {
      
    }
  };

  const handleUpdatePress = async (cartAppId, quantity, productDetailAppId) => {
    try {
      // 서버에 업데이트 요청
      const response = await updateMemberCartApp({
        mem_id: Number(memberInfo.mem_id),
        cart_app_id: cartAppId,
        quantity: quantity,
        product_detail_app_id: productDetailAppId
      });
      
      if (response.success) {
        // 성공시 로컬 상태 업데이트
        const updatedCartList = cartList.map(item => 
          item.cart_app_id === cartAppId ? { ...item, quantity } : item
        );
        setCartList(updatedCartList);
      } else {
        
      }
    } catch (error) {
      
      // 오류 발생시 장바구니 목록 다시 불러오기
      fetchCartList();
    }
  };

  return (
    <>
      <CommonHeader 
        title="장바구니"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        {!cartList.length ? (
          <View style={styles.emptyContainer}>
            <Image source={IMAGES.icons.cartStrokeGray} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>장바구니가 비었어요</Text>
          </View>
        ) : (
          <>
            <View style={[layoutStyle.rowBetween, commonStyle.ph16, commonStyle.mt15, commonStyle.pb25, {borderBottomWidth: 2, borderBottomColor: '#EEEEEE'}]}>
              <View style={[layoutStyle.rowStart]}>
                <TouchableOpacity 
                  style={[commonStyle.mr10]} 
                  onPress={() => toggleSelectAll(cartList, selectedItems, setSelectedItems, setAllSelected)}
                >
                  <Image source={allSelected ? IMAGES.icons.checkboxGreen : IMAGES.icons.checkboxGray} style={styles.allCheckIcon} />
                </TouchableOpacity>
                <Text style={styles.allCheckText}>전체 선택 ({getSelectedCount(cartList, selectedItems)}/{getTotalUniqueProductCount(cartList)})</Text>
              </View>
              <TouchableOpacity onPress={handleSelectDeletePress}>
                <Text style={styles.allDeleteText}>선택삭제</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              {Object.entries(groupedByProductId).map(([productAppId, items]) => {
                const item = items[0];
                const isProductGroupSelected = (items as any[])
                  .filter(cartItem => cartItem?.product_quantity !== 0)
                  .every(cartItem => selectedItems[cartItem.cart_app_id]);
                
                return (
                  <View
                    key={`product-${productAppId}`}
                    style={[commonStyle.pv25, {borderBottomWidth: 5, borderBottomColor: '#EEEEEE', position: 'relative'}]}
                  >
                    <View style={[layoutStyle.rowBetween, commonStyle.ph16]}>
                      <View style={[layoutStyle.rowStart, commonStyle.mb10]}>
                        <TouchableOpacity 
                          style={[commonStyle.mr10]} 
                          onPress={() => toggleSelectProductGroup(productAppId, cartList, selectedItems, setSelectedItems)}
                        >
                          <Image 
                            source={isProductGroupSelected ? IMAGES.icons.checkboxGreen : IMAGES.icons.checkboxGray} 
                            style={styles.allCheckIcon} 
                          />
                        </TouchableOpacity>
                        <Text style={styles.brandName}>{item?.brand_name}</Text>
                      </View>
                    </View>
                    
                    {/* 각 항목별 옵션과 수량 UI - 개별적으로 표시 */}
                    {(items as any[]).map((cartItem, index) => {
                      return (
                        <View key={cartItem.cart_app_id}>
                          {/* 각 카트 아이템마다 썸네일과 제목 표시 */}
                          <View style={[layoutStyle.rowAlignStart, commonStyle.ph16, commonStyle.pv16]}>
                            <View style={[layoutStyle.rowAlignStart]}>
                              <TouchableOpacity 
                                style={[commonStyle.mr10]} 
                                onPress={() => {
                                  const newSelectedItems = { ...selectedItems };
                                  newSelectedItems[cartItem.cart_app_id] = !selectedItems[cartItem.cart_app_id];
                                  setSelectedItems(newSelectedItems);
                                }}
                                disabled={cartItem?.product_quantity === 0}
                              >
                                <Image 
                                  source={selectedItems[cartItem.cart_app_id] ? IMAGES.icons.checkboxGreen : IMAGES.icons.checkboxGray} 
                                  style={styles.allCheckIcon} 
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  navigation.navigate('ShoppingDetail', {
                                    product: {
                                      product_app_id: cartItem.product_app_id,
                                      title: cartItem.title,
                                      price: cartItem.price,
                                      original_price: cartItem.original_price,
                                      discount: cartItem.discount,
                                      image: cartItem.image,
                                      rating: "0"
                                    }
                                  });
                                }}
                              >
                                <ShoppingThumbnailImg 
                                  productAppId={cartItem.product_app_id}
                                  width={scale(80)} 
                                  height={scale(80)}
                                  style={styles.thumbnailImage}
                                  quantity={cartItem.product_quantity}
                                />
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                              style={{marginLeft: scale(10), width: '55%'}}
                              onPress={() => {
                                navigation.navigate('ShoppingDetail', {
                                  product: {
                                    product_app_id: cartItem.product_app_id,
                                    title: cartItem.title,
                                    price: cartItem.price,
                                    original_price: cartItem.original_price,
                                    discount: cartItem.discount,
                                    image: cartItem.image,
                                    rating: "0"
                                  }
                                });
                              }}
                            >
                              <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{cartItem.title}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeletePress(cartItem.product_detail_app_id)}>
                              <Image source={IMAGES.icons.xBlack} style={styles.deleteIcon} />
                            </TouchableOpacity>
                          </View>
                          
                          {/* 상품 옵션 선택 드롭다운 */}
                          <View style={styles.selectContainer}>
                            <View style={[commonStyle.ph16, commonStyle.mb10]}>
                              <TouchableOpacity 
                                style={[
                                  styles.selectBox,
                                  {
                                    borderRadius: showOptions[cartItem.cart_app_id] ? 0 : scale(10),
                                    borderTopLeftRadius: scale(10),
                                    borderTopRightRadius: scale(10),
                                    borderBottomLeftRadius: showOptions[cartItem.cart_app_id] ? 0 : scale(10),
                                    borderBottomRightRadius: showOptions[cartItem.cart_app_id] ? 0 : scale(10),
                                    borderBottomWidth: showOptions[cartItem.cart_app_id] ? 0 : 1,
                                    backgroundColor: cartItem?.product_quantity === 0 ? '#EEEEEE' : '#FFFFFF'
                                  }
                                ]}
                                disabled={cartItem?.product_quantity === 0}
                                onPress={() => {
                                  if (!showOptions[cartItem.cart_app_id]) {
                                    fetchProductDetailData(cartItem.product_app_id);
                                  }
                                  setShowOptions(prev => ({...prev, [cartItem.cart_app_id]: !prev[cartItem.cart_app_id]}));
                                }}
                              >
                                <Text style={styles.selectBoxText}>
                                  {selectedOptions[cartItem.cart_app_id]?.option_gender && (selectedOptions[cartItem.cart_app_id]?.option_gender === 'W' ? '여성' : '남성')} {selectedOptions[cartItem.cart_app_id]?.option_amount}{selectedOptions[cartItem.cart_app_id]?.option_unit}
                                </Text>
                                <Image 
                                  source={showOptions[cartItem.cart_app_id] ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} 
                                  style={styles.arrowDownIcon} 
                                />
                              </TouchableOpacity>
                              <View style={[commonStyle.mt5]}>
                                {cartItem?.product_quantity === 0 && <Text style={{color: '#848484', fontSize: scale(10)}}>선택한 제품이 품절되었습니다</Text>}
                              </View>
                            </View>
                          </View>
                          
                          {/* Move options dropdown outside the selectContainer */}
                          {showOptions[cartItem.cart_app_id] && (
                            <View style={[
                              commonStyle.ph16,
                              {
                                position: 'absolute',
                                top: scale(152),
                                left: 0,
                                right: 0,
                                zIndex: 9999,
                              }
                            ]}>
                              <View style={{
                                borderColor: '#D9D9D9',
                                borderWidth: 1,
                                borderTopWidth: 0,
                                borderBottomLeftRadius: scale(10),
                                borderBottomRightRadius: scale(10),
                                backgroundColor: '#FFFFFF',
                              }}>
                                <ScrollView 
                                  style={{maxHeight: scale(150)}}
                                  nestedScrollEnabled={true}
                                >
                                  {(productDetailData[cartItem.product_app_id] as any[])?.length > 0 && (
                                    (productDetailData[cartItem.product_app_id] as any[]).map((option, index) => (
                                      <TouchableOpacity 
                                        key={option.product_detail_app_id}
                                        style={[
                                          styles.optionItem,
                                          index === productDetailData[cartItem.product_app_id].length - 1 && { borderBottomWidth: 0 },
                                          option.quantity === 0 && { backgroundColor: '#EEEEEE' }
                                        ]}
                                        disabled={option.quantity === 0}
                                        onPress={() => {
                                          if (option.quantity > 0) {
                                            setSelectedOptions(prev => ({
                                              ...prev,
                                              [cartItem.cart_app_id]: {
                                                option_gender: option.option_gender,
                                                option_amount: option.option_amount,
                                                option_unit: option.option_unit
                                              }
                                            }));
                                            
                                            setShowOptions(prev => ({...prev, [cartItem.cart_app_id]: false}));
                                            
                                            // 옵션 변경 시 서버에 업데이트 요청
                                            handleUpdatePress(cartItem.cart_app_id, cartItem.quantity, option.product_detail_app_id);
                                          }
                                        }}
                                      >
                                        <Text style={styles.optionText}>
                                          {option?.option_gender && (option?.option_gender === 'W' ? '여성' : '남성')} {option?.option_amount}{option?.option_unit}
                                        </Text>
                                      </TouchableOpacity>
                                    ))
                                  )}
                                </ScrollView>
                              </View>
                            </View>
                          )}

                          <View style={[commonStyle.ph16, layoutStyle.rowBetween, commonStyle.mt65]}>
                            <View style={[styles.quantityContainer, {backgroundColor: cartItem?.product_quantity === 0 ? '#EEEEEE' : '#FFFFFF'}]}>
                              <TouchableOpacity 
                                style={styles.quantityButton}
                                onPress={() => {
                                  if (cartItem.quantity > 1) {
                                    const newQuantity = cartItem.quantity - 1;
                                    decreaseQuantity(cartItem, cartList, setCartList);
                                    handleUpdatePress(cartItem.cart_app_id, newQuantity, cartItem.product_detail_app_id);
                                  }
                                }}
                                disabled={cartItem.quantity <= 1 || cartItem?.product_quantity === 0}
                              >
                                <Image 
                                  source={cartItem.quantity > 1 ? IMAGES.icons.minusBlack : IMAGES.icons.minusGray}
                                  style={styles.quantityButtonIcon} 
                                />
                              </TouchableOpacity>
                              <Text style={[styles.quantityText, {color: cartItem?.product_quantity === 0 ? '#848484' : '#202020'}]}>{cartItem.quantity}</Text>
                              <TouchableOpacity 
                                style={styles.quantityButton}
                                onPress={() => {
                                  if (cartItem.quantity < (cartItem.product_quantity)) {
                                    const newQuantity = cartItem.quantity + 1;
                                    increaseQuantity(cartItem, cartList, setCartList);
                                    handleUpdatePress(cartItem.cart_app_id, newQuantity, cartItem.product_detail_app_id);
                                  }
                                }}
                                disabled={cartItem.quantity >= (cartItem.product_quantity) || cartItem?.product_quantity === 0}
                              >
                                <Image 
                                  source={cartItem.quantity >= (cartItem.product_quantity) ? IMAGES.icons.plusGray : IMAGES.icons.plusBlack} 
                                  style={styles.quantityButtonIcon} 
                                />
                              </TouchableOpacity>
                            </View>
                            <View style={[layoutStyle.rowEnd]}>
                              {cartItem?.discount > 0 && (
                                <>
                                  <Text style={styles.originalPriceText}>
                                    {(cartItem?.original_price * cartItem.quantity).toLocaleString()}원
                                  </Text>
                                  <Text style={styles.discountText}>{cartItem?.discount}%</Text>
                                </>
                              )}
                              <Text style={styles.priceText}>{(cartItem.price * cartItem.quantity).toLocaleString()}원</Text>
                            </View>
                          </View>
                          
                          {index < (items as any[]).length - 1 && (
                            <View style={styles.itemDivider} />
                          )}
                        </View>
                    )})}
                  </View>
                );
              })}
              <View style={[commonStyle.ph16, commonStyle.pv16]}>
                <Text style={styles.totalPriceTitle}>예상 결제금액</Text>
                <View style={[layoutStyle.rowBetween]}>
                  <Text style={styles.priceTitle}>총 상품금액</Text>
                  <Text style={styles.priceText}>{(cartList.filter(item => selectedItems[item.cart_app_id]).reduce((acc, item) => acc + (item.price * item.quantity), 0)).toLocaleString()}원</Text>
                </View>
                <View style={[layoutStyle.rowBetween, commonStyle.pt10]}>
                  <Text style={styles.priceTitle}>총 할인금액</Text>
                  <Text style={styles.priceText}>{(cartList.filter(item => selectedItems[item.cart_app_id]).reduce((acc, item) => {
                    const discountAmount = item.original_price ? (item.original_price - item.price) * item.quantity : 0;
                    return acc + discountAmount;
                  }, 0)).toLocaleString()}원</Text>
                </View>
                <View style={styles.itemDivider} />
                <View style={[layoutStyle.rowBetween]}>
                  <Text style={styles.priceTitle}>총 결제금액</Text>
                  <Text style={{fontSize: scale(16), fontWeight: '600', color: '#F04D4D'}}>{(cartList.filter(item => selectedItems[item.cart_app_id]).reduce((acc, item) => acc + (item.price * item.quantity), 0)).toLocaleString()}원</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.paymentButton, layoutStyle.rowCenter, {backgroundColor: !getSelectedCount(cartList, selectedItems) ? '#CBCBCB' : '#40B649'}]} 
                disabled={!getSelectedCount(cartList, selectedItems)}
                onPress={() => navigation.navigate('ShoppingPayment', {
                  selectedItems: cartList.filter(item => selectedItems[item.cart_app_id])
                })}
              >
                <Text style={{fontSize: scale(16), fontWeight: '600', color: '#FFFFFF'}}>{(cartList.filter(item => selectedItems[item.cart_app_id]).reduce((acc, item) => acc + (item.price * item.quantity), 0)).toLocaleString()}원 결제하기</Text>
                <View style={styles.circle}>
                  <Text style={{fontSize: scale(12), fontWeight: '600', color: !getSelectedCount(cartList, selectedItems) ? '#CBCBCB' : '#40B649'}}>{getSelectedCount(cartList, selectedItems)}</Text> 
                </View>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

      </View>

      <CommonPopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onConfirm={popup.onConfirm}
        onCancel={popup.type === 'confirm' ? popup.onCancel : undefined}
        confirmText="확인"
        cancelText="취소"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  allCheckIcon: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
  },
  allCheckText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#202020',
  },
  allDeleteText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#202020',
  },
  brandName: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#202020',
  },
  deleteIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
    marginTop: scale(2),
    marginLeft: scale(10),
  },
  thumbnailImage: {
    borderRadius: scale(4),
  },
  title: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#202020',
  },
  selectContainer: {
    position: 'absolute',
    top: scale(115),
    left: 0,
    right: 0,
    zIndex: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: scale(8),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
  },
  quantityButton: {
    borderRadius: scale(5),
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(5),
  },
  quantityButtonIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
  },
  quantityText: {
    fontSize: scale(14),
    color: '#202020',
    marginHorizontal: scale(10),
    textAlign: 'center',
    minWidth: scale(45),
  },
  optionText: {
    fontSize: scale(14),
    color: '#717171',
  },
  originalPriceText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#CBCBCB',
    marginRight: scale(8),
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#F04D4D',
    marginRight: scale(8),
  },
  priceText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#202020',
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: scale(10),
    backgroundColor: '#FFFFFF',
  },
  selectBoxText: {
    fontSize: scale(14),
    color: '#717171',
  },
  arrowDownIcon: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
  },
  optionItem: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyText: {
    fontSize: scale(16),
    color: '#CBCBCB',
    fontWeight: 'bold',
    marginTop: scale(10),
  },
  emptyIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: scale(20),
  },
  totalPriceTitle: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#202020',
    marginBottom: scale(10),
  },
  priceTitle: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#848484',
  },
  paymentButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(10),
    padding: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(16),
    marginVertical: scale(15),
  },
  circle: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(20),
    width: scale(18),
    height: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(5),
  }
});

export default ShoppingCart; 