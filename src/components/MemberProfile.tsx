import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useAuth} from '../hooks/useAuth';

interface MemberProfileProps {
  mem_id?: string; // 선택적 파라미터로 변경
}

const MemberProfile: React.FC<MemberProfileProps> = ({mem_id}) => {
  const {memberInfo, loading, error, loadMemberInfo, saveMemberId} = useAuth();

  useEffect(() => {
    if (mem_id) {
      // 특정 회원 ID가 전달된 경우 해당 ID로 정보 조회
      saveMemberId(mem_id).then(() => loadMemberInfo());
    } else {
      // 전달된 ID가 없으면 저장된 ID로 정보 조회
      loadMemberInfo();
    }
  }, [mem_id]);

  const handleRefresh = () => {
    loadMemberInfo();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6BC46A" />
        <Text style={styles.loadingText}>회원 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!memberInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>회원 정보가 없습니다.</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>정보 불러오기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {/* 프로필 이미지가 들어갈 자리 */}
        </View>
        <Text style={styles.nameText}>{memberInfo.name}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>회원 ID</Text>
          <Text style={styles.infoValue}>{memberInfo.mem_id}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>이메일</Text>
          <Text style={styles.infoValue}>{memberInfo.email}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>전화번호</Text>
          <Text style={styles.infoValue}>{memberInfo.phone}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>새로고침</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#242527',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#444444',
    marginBottom: 12,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  infoLabel: {
    fontSize: 16,
    color: '#999999',
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#6BC46A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MemberProfile; 