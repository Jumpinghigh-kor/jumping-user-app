import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect, CommonActions} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import CommonPopup from '../components/CommonPopup';
import { useAppSelector } from '../store/hooks';
import { useAuth } from '../hooks/useAuth';
import { getPostAppList } from '../api/services/postAppService';

const ShoppingMypage: React.FC = () => {
  const navigation = useNavigation();
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const { loadMemberInfo } = useAuth();
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasUnreadShoppingPost, setHasUnreadShoppingPost] = useState(false);
  const [unreadShoppingPostCount, setUnreadShoppingPostCount] = useState(0);

  // 화면이 포커스될 때마다 회원 정보 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadMemberInfo();
      const checkUnread = async () => {
        try {
          if (!memberInfo?.mem_id) return;
          const res = await getPostAppList(parseInt(memberInfo.mem_id, 10), 'SHOPPING');
          if (res?.success && res?.data) {
            const unreadItems = res.data.filter((item: any) => {
              const allSendYn = item.all_send_yn;
              const readYn = item.read_yn;
              return (
                (allSendYn === 'N' && readYn === 'N') ||
                (allSendYn === 'Y' && (!readYn || readYn === ''))
              );
            });
            setHasUnreadShoppingPost(unreadItems.length > 0);
            setUnreadShoppingPostCount(unreadItems.length);
          } else {
            setHasUnreadShoppingPost(false);
            setUnreadShoppingPostCount(0);
          }
        } catch (e) {
          setHasUnreadShoppingPost(false);
          setUnreadShoppingPostCount(0);
        }
      };
      checkUnread();
    }, [])
  );

  return (
    <>
      <CommonHeader 
        title="마이페이지"
        titleColor="#FFFFFF"
        backIcon={IMAGES.icons.arrowLeftWhite}
        backgroundColor="#42B649"
        rightIcon={
          <TouchableOpacity onPress={() => navigation.navigate('ShoppingPostList' as never)}>
            <View style={styles.mailWrapper}>
              <Image source={IMAGES.icons.mailStrokeWhite} style={styles.homeIcon} />
              {hasUnreadShoppingPost && (
                <View style={styles.notificationDot}>
                  <Text style={styles.notificationDotText}>
                    {unreadShoppingPostCount > 9 ? '9+' : unreadShoppingPostCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        }
        onBackPress={() => navigation.navigate('MainTab', { screen: 'Shopping' })}
      />
      <View style={styles.container}>
        <View style={styles.infoSection}>
          <View style={styles.profileUserContainer}>
            <Text style={styles.profileUserName}>
              <Text style={{fontWeight: 'bold', fontSize: scale(18)}}>{memberInfo?.mem_name}님 </Text>
                점핑하이와 함께{'\n'}즐거운 쇼핑되세요!
              </Text>
          </View>
          <View style={styles.infoContainer}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('ShoppingOrderHistory')}
            >
              <Image source={IMAGES.icons.orderGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>주문내역</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('ShoppingReview')}
            >
              <Image source={IMAGES.icons.speechGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>내 리뷰</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('ShoppingNotice')}
            >
              <Image source={IMAGES.icons.bellGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>알림</Text>
            </TouchableOpacity>
          </View>

          <View style={{marginTop: scale(10), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View>
              <Image source={IMAGES.icons.giftWhite} style={styles.giftIcon} />
            </View>
            <View style={styles.inventoryContainer}>
              <TouchableOpacity
                style={{flexDirection: 'row', alignItems: 'center'}}
                onPress={() => navigation.navigate('ShoppingPoint')}
              >
                <Image source={IMAGES.icons.pointBlue} style={styles.inventoryImg} />
                <View style={{marginRight: scale(10)}}>
                  <Text style={styles.inventoryText}>포인트</Text>
                  <Text style={{...styles.inventoryText, color: '#5588FF'}}>{!memberInfo?.total_point ? '0' : memberInfo?.total_point}P</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{flexDirection: 'row', alignItems: 'center'}}
                onPress={() => navigation.navigate('ShoppingCoupon')}
              >
                <Image source={IMAGES.icons.couponBlue} style={styles.inventoryImg} />
                <View>
                  <Text style={styles.inventoryText}>쿠폰</Text>
                  <Text style={{...styles.inventoryText, color: '#5588FF'}}>{memberInfo?.coupon_cnt}장</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShoppingAddress')}>
              <Text style={styles.menuText}>배송지 관리</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShoppingReturnHistory')}>
              <Text style={styles.menuText}>취소•반품•교환 내역</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShoppingZZim')}>
              <Text style={styles.menuText}>찜한 상품 보기</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShoppingCart')}>
              <Text style={styles.menuText}>장바구니 보기</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShoppingInquiry')}>
              <Text style={styles.menuText}>문의 하기</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity> */}
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowExitPopup(true);
            }}>
              <Text style={styles.menuText}>쇼핑몰 나가기</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 쇼핑 나가기 확인 팝업 */}
        <CommonPopup
          visible={showExitPopup}
          title="쇼핑몰을 나가시겠습니까?"
          message="쇼핑몰을 나가시겠습니까?"
          backgroundColor='#FFFFFF'
          textColor='#202020'
          onConfirm={() => {
            setShowExitPopup(false);
            navigation.navigate('MainTab', { screen: 'Home' });
          }}
          onCancel={() => setShowExitPopup(false)}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#42B649',
  },
  infoSection: {
    paddingHorizontal: scale(16),
  },
  profileUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scale(5),
  },
  profileUserName: {
    fontSize: scale(16),
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: scale(22),
  },
  giftIcon: {
    width: scale(100),
    height: scale(100),
    resizeMode: 'contain',
    marginRight: scale(20),
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(15),
    height: scale(100),
    paddingHorizontal: scale(30),
    marginTop: scale(20),
  },
  infoItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(15),
    height: scale(100),
    paddingHorizontal: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    width: '30%',
  },
  inventoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFE291',
    borderRadius: scale(15),
    height: scale(100),
    width: '66.5%',
    paddingHorizontal: scale(20),
  },
  inventoryImg: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
    marginRight: scale(8),
  },
  inventoryText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#202020',
  },
  infoIcon: {
    width: scale(30),
    height: scale(30),
    resizeMode: 'contain',
    marginBottom: scale(15),
  },
  infoText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#202020',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: scale(20),
    borderTopLeftRadius: scale(20),
    marginTop: scale(30),
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(14),
  },
  arrowIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
  },
  menuText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#202020',
  },
  homeBtn: {
    padding: scale(10),
  },
  homeIcon: {
    width: scale(18),
    height: scale(18),
    resizeMode: 'contain',
  },
  mailWrapper: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -scale(6),
    right: -scale(6),
    minWidth: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    backgroundColor: '#F04D4D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(3),
  },
  notificationDotText: {
    color: '#FFFFFF',
    fontSize: scale(9),
    fontWeight: 'bold',
  },
});

export default ShoppingMypage; 