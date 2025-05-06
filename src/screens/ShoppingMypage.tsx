import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';

// 네비게이션 타입 정의
type RootStackParamList = {
  Shopping: undefined;
  ShoppingHome: undefined;
};

type ShoppingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ShoppingMypage: React.FC = () => {
  const navigation = useNavigation<ShoppingNavigationProp>();
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  return (
    <>
      <CommonHeader 
        title="마이페이지"
        titleColor="#FFFFFF"
        backIcon={IMAGES.icons.arrowLeftWhite}
        backgroundColor="#42B649"
      />
      <View style={styles.container}>
        <View style={styles.infoSection}>
          <View style={styles.profileUserContainer}>
            <Text style={styles.profileUserName}><Text style={{fontWeight: 'bold', fontSize: scale(18)}}>{memberInfo?.mem_name}님</Text> 점핑하이와 함께{'\n'}즐거운 쇼핑되세요!</Text>
            <Image source={IMAGES.icons.giftWhite} style={styles.giftIcon} />
          </View>

          <View style={styles.infoContainer}>
            <TouchableOpacity style={styles.infoItem} onPress={() => navigation.navigate('ShoppingOrderHistory')}>
              <Image source={IMAGES.icons.orderGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>주문내역</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoItem} onPress={() => navigation.navigate('ShoppingReview')}>
              <Image source={IMAGES.icons.speechGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>내 리뷰</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoItem} onPress={() => navigation.navigate('ShoppingInquiry')}>
              <Image source={IMAGES.icons.doubleTalkGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>문의</Text>
            </TouchableOpacity>
          </View>

          <View style={{marginTop: scale(10), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <TouchableOpacity style={styles.bellContainer}>
              <Image source={IMAGES.icons.bellGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>알림</Text>
            </TouchableOpacity>

            <View style={styles.inventoryContainer}>
              <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image source={IMAGES.icons.pointBlue} style={styles.inventoryImg} />
                <View style={{marginRight: scale(10)}}>
                  <Text style={styles.inventoryText}>포인트</Text>
                  <Text style={{...styles.inventoryText, color: '#5588FF'}}>5000P</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image source={IMAGES.icons.couponBlue} style={styles.inventoryImg} />
                <View>
                  <Text style={styles.inventoryText}>쿠폰</Text>
                  <Text style={{...styles.inventoryText, color: '#5588FF'}}>10장</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>공지사항</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShoppingAddress')}>
              <Text style={styles.menuText}>배송지 관리</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.menuText}>쇼핑 나가기</Text>
              <Image source={IMAGES.icons.arrowRightBlack} style={styles.arrowIcon} />
            </TouchableOpacity>
          </View>
        </View>
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
    marginTop: scale(5),
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
    paddingTop: scale(24),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(10),
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
  }
});

export default ShoppingMypage; 