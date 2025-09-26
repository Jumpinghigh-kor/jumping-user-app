import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation/AuthStackNavigator';
import CommonHeader from '../components/CommonHeader';
import { PostAppType, insertMemberPostApp, updateMemberPostApp } from '../api/services/postAppService';
import { scale } from '../utils/responsive';
import { useAppSelector } from '../store/hooks';
import IMAGES from '../utils/images';

type  ShoppingPostDetailRouteProp = RouteProp<AuthStackParamList, 'ShoppingPostDetail'>;

const ShoppingPostDetail = () => {
  const navigation = useNavigation();
  const route = useRoute<ShoppingPostDetailRouteProp>();
  const post = route.params.post as PostAppType;
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // param(post) 가 준비되면 로딩 종료
    if (route?.params?.post) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [route?.params?.post]);

  useEffect(() => {
    const runSideEffect = async () => {
      if (!post) return;

      try {
        const allSendYn = (post as any).all_send_yn;
        const readYn = post.read_yn;

        // 1) all_send_yn === 'Y' && read_yn is null/undefined → insert
        if (allSendYn === 'Y' && (readYn === null || readYn === undefined)) {
          await insertMemberPostApp({ post_app_id: post.post_app_id, mem_id: memberInfo?.mem_id });
          return;
        }

        // 2) all_send_yn === 'N' && read_yn === 'N' → update read_yn to 'Y'
        if (allSendYn === 'N' && readYn === 'N') {
          await updateMemberPostApp({ member_post_app_id: post.member_post_app_id, read_yn: 'Y', mem_id: memberInfo?.mem_id });
          return;
        }
      } catch (e) {
        // swallow per requirement: don't touch other parts/UI
      }
    };

    runSideEffect();
  }, [post]);
  
  return (
      <View style={styles.container}>
        <CommonHeader
          title="우편함"
          titleColor="#202020"
          backIcon={IMAGES.icons.arrowLeftBlack}
          backgroundColor="#FFFFFF"
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43B546" />
          </View>
        ) : (
          <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
              alwaysBounceVertical={false}
            >
            <View style={styles.header}>
              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.date}>{post.reg_dt}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.contentText}>{post.content}</Text>
              </View>
            </ScrollView>
          )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#373737',
    paddingBottom: scale(14),
  },
  title: {
    color: '#202020',
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
  },
  date: {
    color: '#848484',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Regular',
    marginTop: scale(5),
  },
  content: {
    paddingTop: scale(14),
  },
  contentText: {
    color: '#202020',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShoppingPostDetail; 