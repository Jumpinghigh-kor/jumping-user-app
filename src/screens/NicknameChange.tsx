import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {scale} from '../utils/responsive';
import CommonHeader from '../components/CommonHeader';
import { checkNicknameDuplicate, completeSignup, updateChangeNickname } from '../api/services/membersService';
import { useAppSelector } from '../store/hooks';
import CommonPopup from '../components/CommonPopup';

const NicknameChange = () => {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'default' | 'warning' | 'confirm'>('default');

  const handleNicknameChange = async () => {
    setIsSubmitting(true);
    try {
      const nicknameResponse = await checkNicknameDuplicate(nickname);
      if (!nicknameResponse.success) {
        setPopupMessage('닉네임이 중복되었습니다.');
        setPopupType('warning');
        setPopupVisible(true);
        setIsSubmitting(false);
        return;
      }
      const nicknameChangeResponse = await updateChangeNickname(memberInfo?.mem_id, nickname);
      if (!nicknameChangeResponse.success) {
        setIsSubmitting(false);
        return;
      }
      setNickname('');
      setIsSubmitting(false);
      setPopupMessage('닉네임이 변경되었습니다.');
      setPopupType('default');
      setPopupVisible(true);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <CommonHeader title="닉네임 변경" />
      <View style={styles.container}>
        <Text style={styles.title}>닉네임을{'\n'}입력해주세요</Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={(text) => {
                setNickname(text);
              }}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor="#848484"
              maxLength={10}
              editable={!isSubmitting}
            />
            <Text style={styles.characterCount}>{nickname.length}/10</Text>
          </View>
          <View style={styles.underline} />
        </View>

        <TouchableOpacity 
          style={[
            styles.nicknameChangeButton,
            (isSubmitting || !nickname.trim()) && styles.nicknameChangeButtonDisabled
          ]} 
          onPress={handleNicknameChange}
          disabled={isSubmitting || !nickname.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.nicknameChangeButtonText}>닉네임 변경</Text>
          )}
        </TouchableOpacity>

        <CommonPopup
          visible={popupVisible}
          message={popupMessage}
          type={popupType}
          onConfirm={() => setPopupVisible(false)}
          confirmText="확인"
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    paddingHorizontal: scale(16),
  },
  profileSection: {
    alignItems: 'center',
    marginTop: scale(30),
  },
  title: {
    fontSize: scale(20),
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
    marginTop: scale(20),
  },
  inputContainer: {
    marginTop: scale(25),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  underline: {
    borderBottomWidth: 0.5,
    borderWidth: 1,
    borderColor: '#444444',
    marginTop: Platform.OS === 'ios' ? scale(10) : scale(0),
  },
  characterCount: {
    color: '#848484',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    marginLeft: scale(10),
  },
  nicknameChangeButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(8),
    paddingVertical: scale(14),
    marginTop: 'auto',
    marginBottom: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  nicknameChangeButtonDisabled: {
    backgroundColor: '#848484',
  },
  nicknameChangeButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
});

export default NicknameChange; 