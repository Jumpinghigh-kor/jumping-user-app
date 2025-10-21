import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  ToastAndroid,
  Alert
} from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import { getProductDetailAppList } from '../api/services/productAppService';
import { insertMemberCartApp } from '../api/services/memberCartAppService';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import CommonPopup from './CommonPopup';
import CustomToast from './CustomToast';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 커스텀 구매 모달 컴포넌트
const CustomPurchaseModal = ({ visible, onClose, product }) => {
  const navigation = useNavigation();
  const translateY = new Animated.Value(0);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [productDetailData, setProductDetailData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  
  // 모달이 열리거나 닫힐 때 상태 초기화
  useEffect(() => {
    if (visible) {
      // 모달이 열릴 때 애니메이션 초기화
      translateY.setValue(0);
      // 상품 상세 데이터 가져오기
      fetchProductDetailData();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setShowOptions(false);
      setSelectedOptions([]);
      setQuantity(1);
    }
  }, [visible]);

  // 상품 상세 데이터 가져오기
  const fetchProductDetailData = async () => {
    try {
      const response = await getProductDetailAppList({
        product_app_id: product.product_app_id
      });
      
      if (response.success && response.data) {
        setProductDetailData(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (error) {
      
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Android에서는 더 민감하게 반응하도록 설정
      return Platform.OS === 'android' 
        ? Math.abs(gestureState.dy) > 5
        : Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: () => {
      // 터치 시작 시 애니메이션 준비
      translateY.setValue(0);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Android에서는 더 짧은 거리에도 닫히도록 설정
      const closeThreshold = Platform.OS === 'android' ? 70 : 100;
      
      if (gestureState.dy > closeThreshold) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true
        }).start(onClose);
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true
        }).start();
      }
    }
  });

  const handleOptionSelect = (option) => {
    // 이미 선택된 옵션인지 확인
    const isOptionAlreadySelected = selectedOptions.some(
      selected => selected.product_detail_app_id === option.product_detail_app_id
    );
    
    // 이미 선택된 옵션이면 추가하지 않음
    if (isOptionAlreadySelected) {
      setShowOptions(false);
      return;
    }
    
    // 새 옵션에 수량 정보 추가
    const newOption = {
      ...option,
      selectedQuantity: 1
    };
    
    setSelectedOptions([...selectedOptions, newOption]);
    setShowOptions(false);
  };

  // 닫기 버튼 핸들러 추가
  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true
    }).start(onClose);
  };

  // 수량 증가 함수
  const increaseQuantity = (optionIndex) => {
    const updatedOptions = [...selectedOptions];
    if (updatedOptions[optionIndex].selectedQuantity < updatedOptions[optionIndex].quantity) {
      updatedOptions[optionIndex].selectedQuantity += 1;
      setSelectedOptions(updatedOptions);
    }
  };

  // 수량 감소 함수
  const decreaseQuantity = (optionIndex) => {
    const updatedOptions = [...selectedOptions];
    if (updatedOptions[optionIndex].selectedQuantity > 1) {
      updatedOptions[optionIndex].selectedQuantity -= 1;
      setSelectedOptions(updatedOptions);
    }
  };

  // 선택 취소 함수
  const clearSelection = (optionIndex) => {
    const updatedOptions = selectedOptions.filter((_, index) => index !== optionIndex);
    setSelectedOptions(updatedOptions);
  };

  // 총 상품 금액 계산
  const calculateTotalOriginalPrice = () => {
    return selectedOptions.reduce((total, option) => {
      return total + ((option.original_price || product.original_price) * option.selectedQuantity);
    }, 0);
  };
  
  // 총 할인 금액 계산
  const calculateTotalDiscount = () => {
    return selectedOptions.reduce((total, option) => {
      const originalPrice = option.original_price || product.original_price;
      const discountedPrice = option.price || product.price;
      return total + ((originalPrice - discountedPrice) * option.selectedQuantity);
    }, 0);
  };
  
  // 총 결제 금액 계산
  const calculateTotalPrice = () => {
    return selectedOptions.reduce((total, option) => {
      return total + ((option.price || product.price) * option.selectedQuantity);
    }, 0);
  };

  // 장바구니 추가 핸들러
  const handleAddToCart = () => {
    // 선택한 상품들을 장바구니에 추가
    const addToCartPromises = selectedOptions.map(option => {
      return insertMemberCartApp({
        mem_id: Number(memberInfo?.mem_id),
        product_detail_app_id: option.product_detail_app_id,
        quantity: option.selectedQuantity
      });
    });

    Promise.all(addToCartPromises)
      .then(() => {
        // 커스텀 토스트 팝업 표시
        setToastMessage('장바구니에 담았습니다');
        setShowToast(true);
      })
      .catch(error => {
        
        setPopupMessage('장바구니 추가 중 오류가 발생했습니다.');
        setShowPopup(true);
      });
  };

  // 팝업 닫기
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={handleClose}
          />
          <Animated.View 
            style={[
              styles.content,
              { transform: [{ translateY }] }
            ]}
          >
            <View style={styles.contentWrapper}>
              <View 
                style={styles.dragArea}
                {...panResponder.panHandlers}
              >
                <View style={styles.barContainer}>
                  <Image source={IMAGES.icons.smallBarLightGray} style={styles.bar} />
                </View>
              </View>
              
              <View style={styles.selectContainer}>
                <TouchableOpacity 
                  style={[
                    styles.selectBox,
                    {
                      borderRadius: showOptions ? 0 : scale(10),
                      borderTopLeftRadius: scale(10),
                      borderTopRightRadius: scale(10),
                      borderBottomLeftRadius: showOptions ? 0 : scale(10),
                      borderBottomRightRadius: showOptions ? 0 : scale(10),
                      borderBottomWidth: showOptions ? 0 : 1,
                    }
                  ]}
                  onPress={() => setShowOptions(!showOptions)}
                >
                  <Text style={styles.selectBoxText}>
                    상품을 선택해주세요
                  </Text>
                  <Image source={showOptions ? IMAGES.icons.arrowUpGray : IMAGES.icons.arrowDownGray} style={styles.arrowDownIcon} />
                </TouchableOpacity>

                {showOptions && (
                  <View style={[
                    styles.optionsContainer,
                    {
                      borderTopWidth: 1,
                      marginTop: -scale(4),
                      borderBottomLeftRadius: scale(10),
                      borderBottomRightRadius: scale(10),
                      backgroundColor: '#FFFFFF',
                    }
                  ]}>
                    <ScrollView 
                      style={styles.optionsList}
                      nestedScrollEnabled={true}
                    >
                      {productDetailData && productDetailData.length > 0 ? (
                        productDetailData.map((option, index) => (
                          <TouchableOpacity 
                            key={option.product_detail_app_id}
                            style={[
                              styles.optionItem,
                              index === productDetailData.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={() => handleOptionSelect(option)}
                          >
                            <Text style={styles.optionText}>
                              {option.product_name} {option.option_gender && (option.option_gender === 'W' ? '여성' : '남성')} {option.option_amount} {option.option_unit}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.noOptionsContainer}>
                          <Text style={styles.noOptionsText}>선택 가능한 상품이 없습니다.</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 선택된 상품이 있을 경우 표시 */}
              {selectedOptions.length > 0 && (
                <ScrollView showsVerticalScrollIndicator={false} style={{marginTop: scale(50)}}>
                  {selectedOptions.map((selectedOption, index) => (
                    <View key={`option-${index}`} style={styles.selectedProductContainer}>
                      <View style={styles.selectedProductBox}>
                        <View style={styles.selectedProductInfo}>
                          <Text style={styles.selectedProductText}>
                            {selectedOption.product_name} {selectedOption.option_gender ? (selectedOption.option_gender === 'W' ? '여성' : '남성') : ''} {selectedOption.option_amount} {selectedOption.option_unit}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => clearSelection(index)}
                        >
                          <Image source={IMAGES.icons.xBlack} style={styles.closeIcon} />
                        </TouchableOpacity>
                      </View>

                      <View>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: scale(20)}}>
                          <View style={styles.quantityContainer}>
                            <TouchableOpacity 
                              style={styles.quantityButton}
                              onPress={() => decreaseQuantity(index)}
                              disabled={selectedOption.selectedQuantity <= 1}
                            >
                              <Image source={selectedOption.selectedQuantity > 1 ? IMAGES.icons.minusBlack : IMAGES.icons.minusGray} style={styles.quantityButtonIcon} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{selectedOption.selectedQuantity}</Text>
                            <TouchableOpacity 
                              style={styles.quantityButton}
                              onPress={() => increaseQuantity(index)}
                              disabled={selectedOption.selectedQuantity >= selectedOption.quantity}
                            >
                              <Image source={selectedOption.selectedQuantity >= selectedOption.quantity ? IMAGES.icons.plusGray : IMAGES.icons.plusBlack} style={styles.quantityButtonIcon} />
                            </TouchableOpacity>
                          </View>
                          <Text style={[styles.priceText, {color: '#212121'}]}>{(selectedOption.price * selectedOption.selectedQuantity).toLocaleString()}원</Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  {selectedOptions.length > 0 && (
                    <View style={{marginTop: scale(25)}}>
                      <View style={styles.priceContent}>
                        <Text style={styles.priceText}>총 금액</Text>
                        <Text style={styles.priceText}>
                          {calculateTotalOriginalPrice().toLocaleString()}원
                        </Text>
                      </View>
                      <View style={styles.priceContent}>
                        <Text style={styles.priceText}>총 할인 금액</Text>
                        <Text style={styles.priceText}>
                          {calculateTotalDiscount().toLocaleString()}원
                        </Text>
                      </View>
                      <View />

                      <View style={styles.line} />

                      <View style={styles.priceContent}>
                        <Text style={styles.totalPriceText}>총 결제 금액</Text>
                        <Text style={[styles.totalPriceText, {color: '#40B649'}]}>
                          {calculateTotalPrice().toLocaleString()}원
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.cartButton,
                  selectedOptions.length === 0 && styles.cartButtonDisabled
                ]} 
                onPress={handleAddToCart}
                disabled={selectedOptions.length === 0}
              >
                <Text style={[
                  styles.cartButtonText,
                  selectedOptions.length === 0 ? { color: '#FFFFFF' } : { color: '#000000' }
                ]}>장바구니</Text>
              </TouchableOpacity>          
              <TouchableOpacity 
                key={product.product_app_id}
                style={[
                  styles.confirmButton,
                  selectedOptions.length === 0 && { backgroundColor: '#D9D9D9' }
                ]} 
                disabled={selectedOptions.length === 0}
                onPress={() => {
                  // 선택된 상품을 ShoppingPayment에서 사용하는 형태로 변환
                  const selectedItems = selectedOptions.map((option, index) => ({
                    title: product.title,
                    product_app_id: product.product_app_id,
                    product_detail_app_id: option.product_detail_app_id,
                    brand_name: product.brand_name,
                    product_name: product.product_name,
                    original_price: product.original_price,
                    price: option.price,
                    quantity: option.selectedQuantity,
                    option_gender: option.option_gender,
                    option_amount: option.option_amount,
                    option_unit: option.option_unit,
                    discount: product.discount,
                    delivery_fee: product.delivery_fee,
                    free_shipping_amount: product.free_shipping_amount,
                    remote_delivery_fee: product.remote_delivery_fee
                  }));
                  
                  onClose();
                  navigation.navigate('ShoppingPayment' as never, { selectedItems } as never);
                }}
              >
                <Text style={[
                  styles.confirmButtonText,
                  selectedOptions.length === 0 && { color: '#71717' }
                ]}>구매하기</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* 커스텀 토스트 - Modal 내부에 위치 */}
          <CustomToast
            visible={showToast}
            message={toastMessage}
            onHide={() => setShowToast(false)}
            position="bottom"
          />
        </View>
      </Modal>

      {/* 알림 팝업 */}
      <CommonPopup
        visible={showPopup}
        message={popupMessage}
        backgroundColor="#FFFFFF"
        textColor="#202020"
        type="warning"
        onConfirm={handleClosePopup}
        confirmText="확인"
      />
    </>
  );
};

// 구매 모달 스타일
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingTop: scale(10),
    minHeight: scale(430),
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  dragArea: {
    alignItems: 'center',
    marginBottom: scale(15),
    height: scale(20), // 드래그 영역 크기 증가
    justifyContent: 'center',
    width: '100%',
  },
  barContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: -scale(15),
  },
  bar: {
    width: scale(40),
    height: scale(4),
    resizeMode: 'contain',
  },
  selectContainer: {
    position: 'absolute',
    top: scale(40),
    left: 0,
    right: 0,
    zIndex: 10,
  },
  productInfoContainer: {
    marginBottom: scale(20),
  },
  productName: {
    fontSize: scale(16),
    marginBottom: scale(10),
    color: '#202020',
  },
  productPrice: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#202020',
  },
  priceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: scale(5),
    marginHorizontal: scale(20),
  },
  line: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: scale(20),
    marginVertical: scale(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
    marginTop: scale(15),
  },
  confirmButton: {
    backgroundColor: '#43B546',
    borderRadius: scale(30),
    paddingVertical: scale(15),
    alignItems: 'center',
    width: '48%',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  cartButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: scale(30),
    paddingVertical: scale(15),
    alignItems: 'center',
    width: '48%',
  },
  cartButtonDisabled: {
    backgroundColor: '#D9D9D9',
  },
  cartButtonText: {
    color: '#71717',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    padding: scale(10),
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
  optionsContainer: {
    borderColor: '#D9D9D9',
    borderWidth: 1,
    maxHeight: scale(200),
  },
  optionsList: {
    paddingLeft: scale(5),
  },
  optionItem: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  optionText: {
    fontSize: scale(14),
    color: '#202020',
  },
  noOptionsContainer: {
    padding: scale(10),
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: scale(14),
    color: '#848484',
  },
  selectedProductContainer: {
    backgroundColor: '#EEEEEE',
    borderRadius: scale(10),
    padding: scale(15),
    marginTop: scale(15),
  },
  selectedProductBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductText: {
    fontSize: scale(14),
    color: '#202020',
    fontWeight: '500',
  },
  removeButton: {
    padding: scale(5),
  },
  closeIcon: {
    width: scale(8),
    height: scale(8),
    resizeMode: 'contain',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    borderRadius: scale(5),
    justifyContent: 'center',
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(10),
    paddingVertical: scale(3),
    minWidth: scale(45),
  },
  priceText: {
    fontSize: scale(14),
    color: '#848484',
    fontWeight: '500',
  },
  totalPriceText: {
    fontSize: scale(16),
    color: '#848484',
    fontWeight: '500',
  },
});

export default CustomPurchaseModal; 