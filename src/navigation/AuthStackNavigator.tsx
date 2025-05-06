import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../screens/Login';
import ForgotCredentials from '../screens/ForgotCredentials';
import MainTabNavigator from './MainTabNavigator';
import Attendance from '../screens/Attendance';
import AttendanceRecord from '../screens/AttendanceRecord';
import NoticesAppList from '../screens/NoticesAppList';
import InquiryList from '../screens/InquiryList';
import InquiryDetail from '../screens/InquiryDetail';
import Settings from '../screens/Settings';
import PasswordChange from '../screens/PasswordChange';
import SignUp from '../screens/SignUp';
import ShoppingDetail from '../screens/ShoppingDetail';
import ShoppingMypage from '../screens/ShoppingMypage';
import ShoppingZZim from '../screens/ShoppingZZim';
import ShoppingSearch from '../screens/ShoppingSearch';
import ShoppingLoading from '../screens/ShoppingLoading';
import ShoppingCart from '../screens/ShoppingCart';
import ShoppingAddress from '../screens/ShoppingAddress';
import ShoppingAddressAdd from '../screens/ShoppingAddressAdd';
import ShoppingReview from '../screens/ShoppingReview';
import ShoppingReviewModify from '../screens/ShoppingReviewModify';

export type AuthStackParamList = {
  Login: undefined;
  ForgotCredentials: undefined;
  SignUp: undefined;
  MainTab: {
    screen?: string;
  };
  Attendance: undefined;
  AttendanceRecord: undefined;
  NoticesAppList: undefined;
  InquiryList: undefined;
  InquiryRegister: undefined;
  InquiryDetail: {
    inquiry: any;
  };
  Settings: undefined;
  PasswordChange: undefined;
  ShoppingDetail: undefined;
  ShoppingMypage: undefined;
  ShoppingZZim: undefined;
  ShoppingSearch: undefined;
  ShoppingLoading: undefined;
  ShoppingCart: undefined;
  ShoppingAddress: undefined;
  ShoppingAddressAdd: undefined;
  ShoppingReview: undefined;
  ShoppingReviewModify: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Login"
        component={Login}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ForgotCredentials"
        component={ForgotCredentials}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="MainTab"
        component={MainTabNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Attendance"
        component={Attendance}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AttendanceRecord"
        component={AttendanceRecord}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NoticesAppList"
        component={NoticesAppList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="InquiryList"
        component={InquiryList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="InquiryDetail"
        component={InquiryDetail}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="PasswordChange"
        component={PasswordChange}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingDetail"
        component={ShoppingDetail}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingMypage"
        component={ShoppingMypage}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingZZim"
        component={ShoppingZZim}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingSearch"
        component={ShoppingSearch}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingLoading"
        component={ShoppingLoading}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingCart"
        component={ShoppingCart}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingAddress"
        component={ShoppingAddress}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingAddressAdd"
        component={ShoppingAddressAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingReview"
        component={ShoppingReview}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ShoppingReviewModify"
        component={ShoppingReviewModify}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default AuthStackNavigator; 