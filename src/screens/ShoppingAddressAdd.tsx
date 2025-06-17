import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator
} from 'react-native';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import SearchAddress from '../components/SearchAddress';
import { useAppSelector } from '../store/hooks';
import { insertMemberShippingAddress, updateMemberShippingAddress } from '../api/services/memberShippingAddressService';
import CommonPopup from '../components/CommonPopup';

const ShoppingAddressAdd = ({ navigation, route }) => {
  const addressData = route.params?.addressData;
  const [name, setName] = useState(addressData?.receiver_name || '');
  const [phone, setPhone] = useState(addressData?.receiver_phone ? addressData.receiver_phone.replace(/-/g, '') : '');
  const [address, setAddress] = useState(addressData?.address || '');
  const [detailAddress, setDetailAddress] = useState(addressData?.address_detail || '');
  const [zipCode, setZipCode] = useState(addressData?.zip_code || '');
  const [isAddressSearchVisible, setIsAddressSearchVisible] = useState(false);
  const [isDefaultAddress, setIsDefaultAddress] = useState(addressData?.default_yn === 'Y');
  const [entranceMethod, setEntranceMethod] = useState('password');
  const [entrancePassword, setEntrancePassword] = useState('');
  const [etcMessage, setEtcMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [addressName, setAddressName] = useState(addressData?.shipping_address_name || '');
  const [isWarning, setIsWarning] = useState(true);

  const memberInfo = useAppSelector(state => state.member.memberInfo);

  useEffect(() => {
    if (addressData?.enter_way) {
      switch(addressData.enter_way) {
        case 'PASSWORD':
          setEntranceMethod('PASSWORD');
          setEntrancePassword(addressData.enter_memo || '');
          break;
        case 'SECURITY_CALL':
          setEntranceMethod('SECURITY_CALL');
          break;
        case 'FREE':
          setEntranceMethod('FREE');
          break;
        case 'ETC':
          setEntranceMethod('ETC');
          setEtcMessage(addressData.enter_memo || '');
          break;
      }
    }
  }, [addressData]);

  // 전화번호 형식 검증 (숫자만, 11자리)
  const handlePhoneChange = (text: string) => {
    // 숫자만 추출
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // 11자리로 제한
    if (numericValue.length <= 11) {
      setPhone(numericValue);
    }
  };
  
  // 주소 검색 모달 열기
  const openAddressSearch = () => {
    setIsAddressSearchVisible(true);
  };
  
  // 주소 선택 핸들러
  const handleAddressSelect = (data) => {
    setZipCode(data.zonecode);
    setAddress(data.address);
    setIsAddressSearchVisible(false);
  };
  
  // 기본 배송지 토글
  const toggleDefaultAddress = () => {
    setIsDefaultAddress(!isDefaultAddress);
  };

  // 주소 저장 함수
  const handleSaveAddress = async () => {
    // 유효성 검사
    if (!name) {
      setPopupMessage('받는 사람 이름을 입력해주세요.');
      setShowPopup(true);
      return;
    }
    
    if (!phone || phone.length < 10) {
      setPopupMessage('올바른 전화번호를 입력해주세요.');
      setShowPopup(true);
      return;
    }
    
    if (!address) {
      setPopupMessage('주소를 입력해주세요.');
      setShowPopup(true);
      return;
    }
    
    if (!detailAddress) {
      setPopupMessage('상세 주소를 입력해주세요.');
      setShowPopup(true);
      return;
    }
    
    // 입장 방법에 따른 메모 설정
    let enterWay = '';
    let enterMemo = '';
    
    switch (entranceMethod) {
      case 'PASSWORD':
        enterWay = 'PASSWORD';
        enterMemo = entrancePassword;
        break;
      case 'SECURITY_CALL':
        enterWay = 'SECURITY_CALL';
        enterMemo = '';
        break;
      case 'FREE':
        enterWay = 'FREE';
        enterMemo = '';
        break;
      case 'ETC':
        enterWay = 'ETC';
        enterMemo = etcMessage;
        break;
    }
    
    // 비밀번호나 기타사항 입력 필드에 값이 없는 경우 체크
    if ((entranceMethod === 'PASSWORD' && !entrancePassword) || 
        (entranceMethod === 'ETC' && !etcMessage)) {
      setPopupMessage('공동 현관 출입방법을 입력해주세요.');
      setShowPopup(true);
      return;
    }
    
    try {
      setLoading(true);
      
      const params: any = {
        mem_id: memberInfo.mem_id,
        shipping_address_name: addressName || detailAddress.substring(0, 10),
        receiver_name: name,
        receiver_phone: phone,
        default_yn: isDefaultAddress ? 'Y' : 'N' as 'Y' | 'N',
        del_yn: 'N' as 'Y' | 'N',
        address: address,
        address_detail: detailAddress,
        zip_code: zipCode,
        enter_way: enterWay,
        enter_memo: enterMemo
      };
      
      let response;
      
      // If editing, use update API
      if (addressData) {
        params.shipping_address_id = addressData.shipping_address_id;
        response = await updateMemberShippingAddress(params);
      } else {
        response = await insertMemberShippingAddress(params);
      }
      
      if (response.success) {
        setPopupMessage(addressData ? '배송지가 수정되었습니다.' : '배송지가 추가되었습니다.');
        setShowPopup(true);
        setIsWarning(false);
      } else {
        setPopupMessage(response.message || (addressData ? '배송지 수정에 실패했습니다.' : '배송지 추가에 실패했습니다.'));
        setShowPopup(true);
      }
    } catch (error) {
      setPopupMessage(addressData ? '배송지 수정 중 오류가 발생했습니다.' : '배송지 추가 중 오류가 발생했습니다.');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CommonHeader 
        title={addressData ? "배송지 수정" : "배송지 추가"}
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView>
          <View style={styles.formContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.inputTitle}>배송지 이름</Text>
              <TextInput
                style={[
                  styles.input,
                  addressName ? styles.inputFilled : null
                ]}
                placeholder="배송지 이름을 입력해 주세요"
                placeholderTextColor="#848484"
                value={addressName}
                onChangeText={setAddressName}
              />
            </View>
            {/* 받는 사람 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputTitle}>받는 사람</Text>
              <TextInput
                style={[
                  styles.input,
                  name ? styles.inputFilled : null
                ]}
                placeholder="받는 분 성함을 입력해 주세요"
                placeholderTextColor="#848484"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* 전화 번호 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputTitle}>전화 번호</Text>
              <TextInput
                style={[
                  styles.input,
                  phone ? styles.inputFilled : null
                ]}
                placeholder="-없이 전화 번호를 입력해 주세요"
                placeholderTextColor="#848484"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>

            {/* 주소 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputTitle}>주소</Text>
              <View style={styles.addressContainer}>
                <TextInput
                  style={[
                    styles.addressInput,
                    address ? styles.inputFilled : null
                  ]}
                  placeholder="주소 찾기로 입력해 주세요"
                  placeholderTextColor="#848484"
                  value={address}
                  editable={false}
                />
                <TouchableOpacity 
                  style={styles.addressButton}
                  onPress={openAddressSearch}
                >
                  <Text style={styles.addressButtonText}>주소 찾기</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.detailAddressInput,
                  detailAddress ? styles.inputFilled : null
                ]}
                placeholder="상세 주소를 입력해 주세요"
                placeholderTextColor="#848484"
                value={detailAddress}
                onChangeText={setDetailAddress}
              />
              
              {/* 기본 배송지 체크박스 */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={toggleDefaultAddress}
                >
                  <Image 
                    source={isDefaultAddress ? IMAGES.icons.checkboxGreen : IMAGES.icons.checkboxGray} 
                    style={styles.checkboxImage} 
                  />
                </TouchableOpacity>
                <Text style={styles.checkboxText}>기본 배송지로 설정</Text>
              </View>
            </View>
            
            {/* 공동 현관 출입방법 */}
            <View style={styles.inputSection}>
              <Text style={styles.inputTitle}>공동 현관 출입방법</Text>
              
              {/* 비밀번호 */}
              <TouchableOpacity 
                style={styles.radioContainer}
                onPress={() => setEntranceMethod('PASSWORD')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'PASSWORD' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>비밀번호</Text>
                </View>
              </TouchableOpacity>
              
              {entranceMethod === 'PASSWORD' && (
                <View>
                  <TextInput
                    style={[
                      styles.input,
                      entrancePassword ? styles.inputFilled : null
                    ]}
                    placeholder="#1234*, 열쇠 1234종 (최대 20글자)"
                    placeholderTextColor="#848484"
                    value={entrancePassword}
                    onChangeText={setEntrancePassword}
                    maxLength={20}
                  />
                  <Text style={styles.helperText}>공동현관 비밀번호를 입력해 주세요</Text>
                </View>
              )}
              
              {/* 경비실 호출 */}
              <TouchableOpacity 
                style={styles.radioContainer}
                onPress={() => setEntranceMethod('SECURITY_CALL')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'SECURITY_CALL' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>경비실 호출</Text>
                </View>
              </TouchableOpacity>
              
              {/* 자유 출입가능 */}
              <TouchableOpacity 
                style={styles.radioContainer}
                onPress={() => setEntranceMethod('FREE')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'FREE' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>자유 출입가능</Text>
                </View>
              </TouchableOpacity>
              
              {/* 기타사항 */}
              <TouchableOpacity 
                style={styles.radioContainer}
                onPress={() => setEntranceMethod('ETC')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'ETC' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>기타사항</Text>
                </View>
              </TouchableOpacity>
              
              {entranceMethod === 'ETC' && (
                <TextInput
                  style={[
                    styles.input,
                    etcMessage ? styles.inputFilled : null
                  ]}
                  placeholder="최대 20글자"
                  placeholderTextColor="#848484"
                  value={etcMessage}
                  onChangeText={setEtcMessage}
                  maxLength={20}
                />
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* 저장 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSaveAddress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>{addressData ? "수정" : "저장"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* 주소 검색 모달 */}
      <Modal
        visible={isAddressSearchVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsAddressSearchVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setIsAddressSearchVisible(false)}
              style={styles.modalCloseButton}
            >
              <Image source={IMAGES.icons.arrowLeftBlack} style={styles.modalCloseIcon} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>주소 찾기</Text>
          </View>
          <View style={{ flex: 1 }}>
            <SearchAddress 
              navigation={{
                navigate: (_, data) => {
                  if (data && data.params) {
                    handleAddressSelect({
                      zonecode: data.params.zonecode,
                      address: data.params.address
                    });
                  }
                }
              }} 
            />
          </View>
        </View>
      </Modal>

      {/* 알림 팝업 */}
      <CommonPopup
        visible={showPopup}
        message={popupMessage}
        type={isWarning ? 'warning' : 'default'}
        confirmText="확인"
        onConfirm={() => {
          setShowPopup(false);
          if (popupMessage === '배송지가 수정되었습니다.' || popupMessage === '배송지가 추가되었습니다.') {
            navigation.goBack();
          }
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    paddingHorizontal: scale(16),
    marginTop: scale(10),
  },
  inputSection: {
    marginBottom: scale(18),
  },
  inputTitle: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#202020',
    marginBottom: scale(8),
  },
  input: {
    height: scale(40),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    fontSize: scale(14),
    color: '#848484',
  },
  inputFilled: {
    color: '#202020',
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressInput: {
    flex: 1,
    height: scale(40),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    fontSize: scale(14),
    color: '#848484',
    backgroundColor: '#EEEEEE',
    marginRight: scale(10),
  },
  addressButton: {
    backgroundColor: '#202020',
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(12),
  },
  addressButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '500',
  },
  detailAddressInput: {
    marginTop: scale(10),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
  },
  checkbox: {
    marginRight: scale(8),
  },
  checkboxImage: {
    width: scale(14),
    height: scale(14),
    resizeMode: 'contain',
  },
  checkboxText: {
    fontSize: scale(12),
    color: '#202020',
  },
  radioContainer: {
    marginTop: scale(4),
    marginBottom: scale(8),
  },
  radioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioImage: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
    marginRight: scale(8),
  },
  radioText: {
    fontSize: scale(14),
    color: '#202020',
  },
  helperText: {
    fontSize: scale(12),
    color: '#848484',
    marginTop: scale(4),
    marginLeft: scale(4),
    marginBottom: scale(10),
  },
  modalContainer: {
    height: scale(500),
    backgroundColor: '#FFFFFF',
    marginTop: Platform.OS === 'ios' ? scale(60) : scale(0),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalCloseButton: {
    padding: scale(5),
  },
  modalCloseIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#202020',
    marginLeft: scale(10),
  },
  buttonContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#43B546',
    height: scale(48),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '500',
  },
});

export default ShoppingAddressAdd; 