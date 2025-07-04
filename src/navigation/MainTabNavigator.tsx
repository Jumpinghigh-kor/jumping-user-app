import React, {useEffect, useState} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {Platform, View, Text, StyleSheet, Dimensions, Image, TouchableOpacity} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Home from '../screens/Home';
import Reservation from '../screens/Reservation';
import MyPage from '../screens/MyPage';
import Attendance from '../screens/Attendance';
import IMAGES from '../utils/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getInquiryList} from '../api/services/inquiryService';
import {getNoticesAppList} from '../api/services/noticesAppService';
import ShoppingHome from '../screens/ShoppingHome';
import CommonPopup from '../components/CommonPopup';
const Tab = createBottomTabNavigator();
const ShoppingStack = createNativeStackNavigator();
const SCREEN_WIDTH = Dimensions.get('window').width;
import { scale } from '../utils/responsive';

// 커스텀 탭 바 컴포넌트
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const currentRoute = state.routes[state.index].name;
  const isShoppingTab = currentRoute === 'Shopping';
  const [showExitPopup, setShowExitPopup] = useState(false);

  return (
    <View style={[
      styles.tabBarContainer, 
      isShoppingTab && styles.shoppingTabBarContainer
    ]}>
      {isShoppingTab ? (
        // 쇼핑탭 전용 네비게이션 바
        <View style={styles.shoppingTabBar}>
          <TouchableOpacity
            style={styles.shoppingTabItem}
            onPress={() => navigation.navigate('Shopping')}
          >
            <Image 
              source={currentRoute === 'Shopping' ? IMAGES.icons.shopHomeFillGray : IMAGES.icons.shopHomeGray} 
              style={{width: 20, height: 20}} 
              resizeMode='contain'
            />
            <Text style={styles.tabLabel}>홈</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shoppingTabItem}
            onPress={() => {
              // 찜 목록 페이지로 이동
              navigation.navigate('ShoppingZZim')
            }}
          >
            <Image 
              source={currentRoute === 'ShoppingZZim' ? IMAGES.icons.shopHeartFillGray : IMAGES.icons.shopHeartGray} 
              style={{width: 20, height: 20}} 
              resizeMode='contain'
            />
            <Text style={styles.tabLabel}>찜</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shoppingTabItem}
            onPress={() => {
              // 검색 페이지로 이동
              navigation.navigate('ShoppingSearch')
            }}
          >
            <Image 
              source={currentRoute === 'ShoppingSearch' ? IMAGES.icons.shopSearchFillGray : IMAGES.icons.shopSearchGray} 
              style={{width: 20, height: 20}} 
              resizeMode='contain'
            />
            <Text style={styles.tabLabel}>검색</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shoppingTabItem}
            onPress={() => navigation.navigate('ShoppingMypage')}
          >
            <Image 
              source={currentRoute === 'ShoppingMypage' ? IMAGES.icons.shopMyPageFillGray : IMAGES.icons.shopMyPageGray}
              style={{width: 20, height: 20}}
              resizeMode='contain'
            />
            <Text style={styles.tabLabel}>마이페이지</Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => setShowExitPopup(true)}
          >
            <Image 
              source={IMAGES.logo.jumpingBlack}
              style={styles.logoImage}
            />
          </TouchableOpacity>
        </View>
      ) : (
        // 기존 네비게이션 바
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                // Shopping 탭인 경우 RedirectScreen으로 이동
                if (route.name === 'Shopping') {
                  navigation.navigate('RedirectScreen');
                } else {
                  navigation.navigate(route.name);
                }
              }
            };

            // 홈 버튼인 경우 (가운데 탭)
            if (index === 2) {
              return (
                <View key={index} style={styles.homeTabContainer}>
                  <View style={[styles.homeIconContainer, isShoppingTab && styles.shoppingHomeIconContainer]}>
                    <View style={[
                      styles.homeIconBackground,
                      { backgroundColor: isFocused ? '#6BC46A' : '#333333' },
                      isShoppingTab && styles.shoppingHomeIconBackground
                    ]}>
                      <Image
                        source={isFocused ? IMAGES.icons.homeWhite : IMAGES.icons.homeGray}
                        style={{width: 20, height: 20}}
                      />
                      <Text style={[
                        styles.homeText,
                        { color: isFocused ? '#FFFFFF' : '#8E8E93' }
                      ]}>홈</Text>
                    </View>
                    <View style={[styles.homeButtonTouchable, isShoppingTab && styles.shoppingHomeButtonTouchable]} onTouchEnd={onPress} />
                  </View>
                </View>
              );
            }

            // 마이페이지 탭
            if (route.name === 'MyPage') {
              return (
                <View key={index} style={styles.tabItemContainer}>
                  <View
                    style={styles.tabItem}
                    onTouchEnd={onPress}
                  >
                    <View style={styles.iconContainer}>
                      {options.tabBarIcon && options.tabBarIcon({
                        color: isFocused ? (isShoppingTab ? '#FF6347' : '#6BC46A') : '#8E8E93',
                        focused: isFocused,
                      })}
                    </View>
                    {label !== null && (
                      <Text
                        style={[
                          styles.tabLabel,
                          { color: isFocused ? (isShoppingTab ? '#FF6347' : '#6BC46A') : '#8E8E93' }
                        ]}
                      >
                        {label}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }

            // 일반 탭 버튼
            return (
              <View key={index} style={styles.tabItemContainer}>
                <View
                  style={styles.tabItem}
                  onTouchEnd={onPress}
                >
                  {options.tabBarIcon && options.tabBarIcon({
                    color: isFocused ? (isShoppingTab ? '#FF6347' : '#6BC46A') : '#8E8E93',
                    focused: isFocused,
                  })}
                  {label !== null && (
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: isFocused ? (isShoppingTab ? '#FF6347' : '#6BC46A') : '#8E8E93' }
                      ]}
                    >
                      {label}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
      
      <CommonPopup
        visible={showExitPopup}
        message="쇼핑몰을 나가시겠습니까?"
        type="confirm"
        backgroundColor='#FFFFFF'
        textColor='#000000'
        onConfirm={() => {
          setShowExitPopup(false);
          navigation.navigate('Home');
        }}
        onCancel={() => setShowExitPopup(false)}
        confirmText="확인"
        cancelText="취소"
      />
    </View>
  );
};


const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1A1B1D',
          elevation: 0, // Android
          shadowOpacity: 0, // iOS
        },
        headerTitleAlign: 'center',
        headerTintColor: '#FFFFFF',
        animation: 'fade',
      }}>
      <Tab.Screen
        name="Attendance"
        component={Attendance}
        options={{
          title: '출석',
          tabBarLabel: '출석',
          tabBarIcon: ({color, focused}) => (
            <Image
              source={focused ? IMAGES.icons.calendarGreen : IMAGES.icons.calendarGray}
              style={{width: 20, height: 20}}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Reservation"
        component={Reservation}
        options={{
          title: '예약',
          tabBarLabel: '예약',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <Image
              source={focused ? IMAGES.icons.clockGreen : IMAGES.icons.clockGray}
              style={{width: 20, height: 20}}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({color, focused}) => (
            <Image 
              source={focused ? IMAGES.icons.homeWhite : IMAGES.icons.homeGray} 
              style={{width: 20, height: 20}} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingHome}
        options={{
          title: '쇼핑',
          tabBarLabel: '쇼핑',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <Image 
              source={focused ? IMAGES.icons.cartGreen : IMAGES.icons.cartGray} 
              style={{width: 20, height: 20}} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPage}
        options={{
          title: '마이페이지',
          tabBarLabel: '마이페이지',
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <Image 
              source={focused ? IMAGES.icons.profileGreen : IMAGES.icons.profileGray} 
              style={{width: 20, height: 20}} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#333333',
    borderRadius: 10,
    height: 60,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  homeTabContainer: {
    width: 70,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: -25,
    zIndex: 1,
  },
  homeIconBackground: {
    width: 65,
    height: 65,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#202020',
  },
  homeButtonTouchable: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'transparent',
  },
  homeText: {
    fontSize: 10,
    marginTop: 1,
  },
  iconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
  },
  shoppingTabBarContainer: {
    backgroundColor: 'transparent',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  shoppingTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EEEEEE',
    borderTopLeftRadius: Platform.OS === 'ios' ? scale(15) : scale(20),
    borderTopRightRadius: Platform.OS === 'ios' ? scale(15) : scale(20),
    width: '100%',
    height: scale(60),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: scale(6),
    elevation: 5,
  },
  shoppingTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    flex: 1,
  },
  dividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    height: '100%',
  },
  dividerLine: {
    width: 1,
    height: '70%',
    backgroundColor: '#D9D9D9',
  },
  dividerText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  logoImage: {
    width: scale(50),
    height: scale(30),
    resizeMode: 'contain',
  },
  logoText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shoppingHomeIconContainer: {
    top: 0,
    position: 'relative',
  },
  shoppingHomeIconBackground: {
    backgroundColor: '#111111',
    borderRadius: 0,
    borderWidth: 0,
    width: 'auto',
    height: 'auto',
    padding: 5,
  },
  shoppingHomeButtonTouchable: {
    borderRadius: 0,
    width: 'auto',
    height: 'auto',
  },
});

export default MainTabNavigator; 