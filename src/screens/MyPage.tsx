import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const MyPage = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // 모든 저장된 데이터 삭제
              await AsyncStorage.multiRemove([
                'accessToken',
                'refreshToken',
                'memberId',
                // 필요한 경우 다른 데이터도 여기에 추가
              ]);
              
              // 로그인 화면으로 이동
              navigation.reset({
                index: 0,
                routes: [{name: 'Login'}],
              });
            } catch (error) {
              Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  logoutButton: {
    backgroundColor: '#FF4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyPage; 