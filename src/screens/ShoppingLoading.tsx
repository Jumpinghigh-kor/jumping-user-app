import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 네비게이션 타입 정의
type RootStackParamList = {
  ShoppingHome: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShoppingHome'>;

const ShoppingLoading = () => {
  const navigation = useNavigation<NavigationProp>();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('ShoppingHome');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#43B546" />
      <Text style={styles.loadingText}>로딩중</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333333',
  },
});

export default ShoppingLoading;
