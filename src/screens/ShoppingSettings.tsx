import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';
import { commonStyle, layoutStyle } from '../assets/styles/common';


const ShoppingSettings = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [isEventNotificationEnabled, setIsEventNotificationEnabled] = useState(false);
  const [isOrderNotificationEnabled, setIsOrderNotificationEnabled] = useState(false);
  const [isNoticeNotificationEnabled, setIsNoticeNotificationEnabled] = useState(false);
  const [isGuideNotificationEnabled, setIsGuideNotificationEnabled] = useState(false);

  return (
    <>
      <CommonHeader 
        title="환경설정"
        titleColor="#202020"
        backIcon={IMAGES.icons.arrowLeftBlack}
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        <View style={styles.alarmContainer}>
          <View>
            <Text style={styles.title}>알림</Text>
          </View>
          <View style={[layoutStyle.rowBetween]}>
            <Text style={styles.settingText}>이벤트</Text>
            <Switch
              value={isEventNotificationEnabled}
              onValueChange={setIsEventNotificationEnabled}
              trackColor={{ false: '#D9D9D9', true: '#43B649' }}
              />
          </View>
          <View style={[layoutStyle.rowBetween, commonStyle.mt20]}>
            <Text style={styles.settingText}>주문/배송</Text>
            <Switch
              value={isOrderNotificationEnabled}
              onValueChange={setIsOrderNotificationEnabled}
              trackColor={{ false: '#D9D9D9', true: '#43B649' }}
              />
          </View>
          <View style={[layoutStyle.rowBetween, commonStyle.mt20]}>
            <Text style={styles.settingText}>공지</Text>
            <Switch
              value={isNoticeNotificationEnabled}
              onValueChange={setIsNoticeNotificationEnabled}
              trackColor={{ false: '#D9D9D9', true: '#43B649' }}
              />
          </View>
          <View style={[layoutStyle.rowBetween, commonStyle.mt20]}>
            <Text style={styles.settingText}>가이드</Text>
            <Switch
              value={isGuideNotificationEnabled}
              onValueChange={setIsGuideNotificationEnabled}
              trackColor={{ false: '#D9D9D9', true: '#43B649' }}
              />
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  alarmContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    padding: scale(16),
  },
  title: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#202020',
    marginBottom: scale(20),
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
