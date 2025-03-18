import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {Platform, View, Text, StyleSheet, Dimensions} from 'react-native';
import Home from '../screens/Home';
import Shopping from '../screens/Shopping';
import Reservation from '../screens/Reservation';
import MyPage from '../screens/MyPage';
import Attendance from '../screens/Attendance';

const Tab = createBottomTabNavigator();
const SCREEN_WIDTH = Dimensions.get('window').width;

// 커스텀 탭 바 컴포넌트
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
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
              navigation.navigate(route.name);
            }
          };

          // 홈 버튼인 경우 (가운데 탭)
          if (index === 2) {
            return (
              <View key={index} style={styles.homeTabContainer}>
                <View style={styles.homeIconContainer}>
                  <View style={[
                    styles.homeIconBackground,
                    { backgroundColor: isFocused ? '#6BC46A' : '#333333' }
                  ]}>
                    <Icon 
                      name="home" 
                      size={24} 
                      color={isFocused ? '#FFFFFF' : '#8E8E93'} 
                    />
                    <Text style={[
                      styles.homeText,
                      { color: isFocused ? '#FFFFFF' : '#8E8E93' }
                    ]}>홈</Text>
                  </View>
                  <View style={styles.homeButtonTouchable} onTouchEnd={onPress} />
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
                  color: isFocused ? '#6BC46A' : '#8E8E93',
                  focused: isFocused,
                })}
                {label !== null && (
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? '#6BC46A' : '#8E8E93' }
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
      }}>
      <Tab.Screen
        name="Attendance"
        component={Attendance}
        options={{
          title: '출석',
          tabBarLabel: '출석',
          tabBarIcon: ({color, focused}) => (
            <Icon 
              name={focused ? "calendar" : "calendar-outline"} 
              size={24} 
              color={color} 
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
          tabBarIcon: ({color, focused}) => (
            <Icon 
              name={focused ? "time" : "time-outline"} 
              size={24} 
              color={color} 
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
            <Icon 
              name="home" 
              size={24} 
              color="#FFFFFF" 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Shopping"
        component={Shopping}
        options={{
          title: '쇼핑',
          tabBarLabel: '쇼핑',
          tabBarIcon: ({color, focused}) => (
            <Icon 
              name={focused ? "cart" : "cart-outline"} 
              size={24} 
              color={color} 
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
          tabBarIcon: ({color, focused}) => (
            <Icon 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
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
    borderColor: '#242527',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
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
  }
});

export default MainTabNavigator; 