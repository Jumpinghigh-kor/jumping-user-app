import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import { scale } from '../utils/responsive';
import { getMemberPointAppList, MemberPointApp } from '../api/services/memberPointAppService';
import { commonStyle, layoutStyle } from '../assets/styles/common';
import { useAuth } from '../hooks/useAuth';
import { usePullToRefresh } from '../hooks/usePullToRefresh';


const ShoppingPoint = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const { loadMemberInfo } = useAuth();
  const [pointList, setPointList] = useState<MemberPointApp[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const formatYearMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  };

  const formatDisplayDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}년 ${month}월`;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  useEffect(() => {
    const fetchPointList = async () => {
      if (memberInfo?.mem_id) {
        try {
          setLoading(true);
          const yearMonth = formatYearMonth(currentDate);
          const response = await getMemberPointAppList({ 
            mem_id: memberInfo.mem_id,
            reg_ym: yearMonth
          });
          if (response.success) {
            setPointList(response.data);
          }
        } catch (error) {
          console.error('포인트 목록 조회 실패:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPointList();
  }, [memberInfo?.mem_id, currentDate]);

  // 화면이 포커스될 때마다 회원 정보 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadMemberInfo();
    }, [])
  );

  // 당겨서 새로고침 (로딩 오버레이 없이 목록만 갱신)
  const refreshPoints = React.useCallback(async () => {
    if (!memberInfo?.mem_id) return;
    try {
      const yearMonth = formatYearMonth(currentDate);
      const response = await getMemberPointAppList({ 
        mem_id: memberInfo.mem_id,
        reg_ym: yearMonth
      });
      if (response.success) {
        setPointList(response.data);
      }
    } catch (error) {
      // ignore
    }
  }, [memberInfo?.mem_id, currentDate]);

  const { refreshing, onRefresh } = usePullToRefresh(refreshPoints, [memberInfo?.mem_id, currentDate]);
  
  return (
    <>
      <CommonHeader 
        title="포인트"
        titleColor="#FFFFFF"
        backIcon={IMAGES.icons.arrowLeftWhite}
        backgroundColor="#40B649"
      />
      <View style={styles.container}>
        <View style={styles.pointHeader}>
          <Text style={styles.pointHeaderText}>보유 포인트</Text>
          <Text style={styles.pointHeaderValue}>{memberInfo?.total_point ? memberInfo?.total_point : 0}P</Text>
        </View>
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={handlePrevMonth}>
            <Image source={IMAGES.icons.arrowLeftGray} style={styles.dateButtonIcon} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDisplayDate(currentDate)}</Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Image source={IMAGES.icons.arrowRightGray} style={styles.dateButtonIcon} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.pointList}
          scrollEnabled={true}
          alwaysBounceVertical={true}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor="#40B649"
              colors={["#40B649"]}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#40B649" />
            </View>
          ) : pointList?.length > 0 ? (
            pointList?.map((item, index) => (
              <View key={index} style={styles.pointItem}>
                <View>
                  <Text style={styles.brandNameText}>{item.brand_name}</Text>
                  <Text
                    style={styles.pointItemText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.product_name}{item.option_amount ? ' ' + item.option_amount : ''}{item.option_unit !== 'NONE_UNIT' ? item.option_unit : ''}{item.option_gender ? item.option_gender === 'M' ? ' 남성 ' : item.option_gender === 'W' ? ' 여성 ' : ' 공용 ' : ''}{item.order_quantity}개
                  </Text>
                  <Text style={styles.regDtText}>{item.reg_dt}</Text>
                </View>
                <View style={[layoutStyle.alignEnd]}>
                  <Text style={[styles.pointItemValue, {color: item.point_status === 'POINT_ADD' ? '#F04D4D' : '#5588FF'}]}>
                    {item.point_status === 'POINT_ADD' ? `+${item.point_amount}P` : `-${item.point_amount}P`}
                  </Text>
                  <Text style={[styles.regDtText, commonStyle.mt3]}>{item.point_status === 'POINT_ADD'  ? '적립' : '차감'}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Image source={IMAGES.icons.pointGray} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>포인트 내역이 없어요</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pointHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#40B649',
    paddingHorizontal: scale(20),
    paddingVertical: scale(20),
    borderBottomWidth: 5,
    borderBottomColor: '#EEEEEE',
  },
  pointHeaderText: {
    fontSize: scale(12),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pointHeaderValue: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: scale(10),
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: scale(10),
    paddingHorizontal: scale(10),
  },
  dateButtonIcon: {
    width: scale(10),
    height: scale(10),
    resizeMode: 'contain'
  },
  dateText: {
    fontSize: scale(12),
    color: '#848484',
  },
  pointList: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  pointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  brandNameText: {
    fontSize: scale(12),
    color: '#202020',
  },
  pointItemText: {
    fontSize: scale(14),
    color: '#202020',
    marginVertical: scale(2),
    maxWidth: '80%',
  },
  regDtText: {
    fontSize: scale(12),
    color: '#848484',
  },
  pointItemValue: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: '#F04D4D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  emptyIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#CBCBCB',
    fontWeight: 'bold',
    marginTop: scale(10),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(100),
  },
  loadingText: {
    fontSize: scale(16),
    color: '#848484',
  },
});

export default ShoppingPoint;
