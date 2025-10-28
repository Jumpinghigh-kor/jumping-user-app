import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import {formatDateYYYYMMDD} from '../utils/commonFunction';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonPopup from '../components/CommonPopup';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import CustomToast from '../components/CustomToast';
import { InquiryShoppingApp, insertInquiryShoppingApp } from '../api/services/inquiryShoppingAppService';
import { getCommonCodeList } from '../api/services/commonCodeService';
import { getInquiryList } from '../api/services/inquiryService';

const ShoppingInquiry = () => {

  return (
    <CommonHeader
      title="쇼핑몰 문의"
      titleColor="#202020"
      backIcon={IMAGES.icons.arrowLeftBlack}
      backgroundColor="#FFFFFF"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default ShoppingInquiry; 