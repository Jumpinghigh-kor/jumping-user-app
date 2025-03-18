import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../screens/Login';
import ForgotCredentials from '../screens/ForgotCredentials';
import MainTabNavigator from './MainTabNavigator';
import Attendance from '../screens/Attendance';
import AttendanceRecord from '../screens/AttendanceRecord';

export type AuthStackParamList = {
  Login: undefined;
  ForgotCredentials: undefined;
  MainTab: {
    screen?: string;
  };
  Attendance: undefined;
  AttendanceRecord: undefined;
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
        name="MainTab"
        component={MainTabNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Attendance"
        component={Attendance}
        options={{title: '출석체크'}}
      />
      <Stack.Screen
        name="AttendanceRecord"
        component={AttendanceRecord}
        options={{title: '출석 기록'}}
      />
    </Stack.Navigator>
  );
};

export default AuthStackNavigator; 