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
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';

const ShoppingMypage: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>쇼핑 마이페이지</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={IMAGES.icons.profileGray}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.profileName}>사용자</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>쇼핑 정보</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="cart-outline" size={20} color="#333" />
            <Text style={styles.menuText}>주문 내역</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="heart-outline" size={20} color="#333" />
            <Text style={styles.menuText}>찜 목록</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="star-outline" size={20} color="#333" />
            <Text style={styles.menuText}>상품 리뷰</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>계정 설정</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="person-outline" size={20} color="#333" />
            <Text style={styles.menuText}>계정 정보</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="lock-closed-outline" size={20} color="#333" />
            <Text style={styles.menuText}>비밀번호 변경</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="notifications-outline" size={20} color="#333" />
            <Text style={styles.menuText}>알림 설정</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: scale(40),
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: scale(30),
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  profileImageContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  profileImage: {
    width: scale(40),
    height: scale(40),
  },
  profileName: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: scale(10),
  },
  editButton: {
    paddingHorizontal: scale(15),
    paddingVertical: scale(8),
    backgroundColor: '#EEEEEE',
    borderRadius: scale(20),
  },
  editButtonText: {
    fontSize: scale(12),
    color: '#666',
  },
  menuContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
    paddingBottom: scale(10),
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    marginBottom: scale(15),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  menuText: {
    flex: 1,
    fontSize: scale(14),
    marginLeft: scale(10),
  },
});

export default ShoppingMypage; 