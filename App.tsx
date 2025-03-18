/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {Provider} from 'react-redux';
import store from './src/store';
import AuthStackNavigator from './src/navigation/AuthStackNavigator';

const App = () => {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AuthStackNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
