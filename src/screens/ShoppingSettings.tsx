import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';


const ShoppingSettings = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  return (
    <>
      <CommonHeader 
        title="환경설정"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>알림설정</Text>
          <Image source={IMAGES.icons.arrowRightGray} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
  },
  settingText: {
    flex: 1,
    fontSize: scale(14),
  },
  arrowIcon: {
    width: scale(12),
    height: scale(12),
  },
});

export default ShoppingSettings;
