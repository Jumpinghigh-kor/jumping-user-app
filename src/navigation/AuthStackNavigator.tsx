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
        options={{title: '비밀번호 찾기'}}
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
    </Stack.Navigator>
  );
};

export default AuthStackNavigator; 