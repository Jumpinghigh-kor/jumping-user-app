import React, { useState } from 'react';
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
  Image
} from 'react-native';
import CommonHeader from '../components/CommonHeader';
import IMAGES from '../utils/images';
import { scale } from '../utils/responsive';
import SearchAddress from '../components/SearchAddress';

const ShoppingAddressAdd = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isAddressSearchVisible, setIsAddressSearchVisible] = useState(false);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [entranceMethod, setEntranceMethod] = useState('password');
  const [entrancePassword, setEntrancePassword] = useState('');
  const [etcMessage, setEtcMessage] = useState('');

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

  return (
    <>
      <CommonHeader 
        title="배송지 추가"
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
                onPress={() => setEntranceMethod('password')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'password' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>비밀번호</Text>
                </View>
              </TouchableOpacity>
              
              {entranceMethod === 'password' && (
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
                onPress={() => setEntranceMethod('security')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'security' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>경비실 호출</Text>
                </View>
              </TouchableOpacity>
              
              {/* 자유 출입가능 */}
              <TouchableOpacity 
                style={styles.radioContainer}
                onPress={() => setEntranceMethod('free')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'free' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>자유 출입가능</Text>
                </View>
              </TouchableOpacity>
              
              {/* 기타사항 */}
              <TouchableOpacity 
                style={styles.radioContainer}
                onPress={() => setEntranceMethod('etc')}
              >
                <View style={styles.radioWrapper}>
                  <Image 
                    source={entranceMethod === 'etc' ? IMAGES.icons.circleStrokeGreen : IMAGES.icons.circleStrokeGray} 
                    style={styles.radioImage} 
                  />
                  <Text style={styles.radioText}>기타사항</Text>
                </View>
              </TouchableOpacity>
              
              {entranceMethod === 'etc' && (
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
});

export default ShoppingAddressAdd; 