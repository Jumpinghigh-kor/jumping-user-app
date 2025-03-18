import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const Membership = () => {
  // 임시 데이터
  const membershipList = [
    {
      id: 1,
      name: '1개월 회원권',
      price: '50,000원',
      period: '30일',
    },
    {
      id: 2,
      name: '3개월 회원권',
      price: '140,000원',
      period: '90일',
    },
    {
      id: 3,
      name: '6개월 회원권',
      price: '250,000원',
      period: '180일',
    },
    {
      id: 4,
      name: '12개월 회원권',
      price: '450,000원',
      period: '365일',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {membershipList.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.membershipName}>{item.name}</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.period}>이용기간: {item.period}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membershipName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  period: {
    fontSize: 16,
    color: '#666',
  },
});

export default Membership; 