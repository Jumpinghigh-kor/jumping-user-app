import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const Shopping: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>쇼핑몰</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Shopping; 