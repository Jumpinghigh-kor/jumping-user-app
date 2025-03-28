import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../screens/Login';
import ForgotCredentials from '../screens/ForgotCredentials';
import MainTabNavigator from './MainTabNavigator';
import Attendance from '../screens/Attendance';
import AttendanceRecord from '../screens/AttendanceRecord';
import NoticesAppList from '../screens/NoticesAppList';
import InquiryAppList from '../screens/InquiryAppList';
import InquiryAppRegister from '../screens/InquiryAppRegister';
import InquiryAppDetail from '../screens/InquiryAppDetail';
import Settings from '../screens/Settings';
import PasswordChange from '../screens/PasswordChange';
import SignUp from '../screens/SignUp';

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
  InquiryAppList: undefined;
  InquiryAppRegister: undefined;
  InquiryAppDetail: {
    inquiry: any;
  };
  Settings: undefined;
  PasswordChange: undefined;
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
        options={{title: '출석 기록'}}
      />
      <Stack.Screen
        name="NoticesAppList"
        component={NoticesAppList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="InquiryAppList"
        component={InquiryAppList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="InquiryAppRegister"
        component={InquiryAppRegister}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="InquiryAppDetail"
        component={InquiryAppDetail}
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
    </Stack.Navigator>
  );
};

export default AuthStackNavigator; 