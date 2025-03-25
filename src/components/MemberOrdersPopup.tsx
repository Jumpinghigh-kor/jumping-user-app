import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {scale} from '../utils/responsive';
import {MemberOrder} from '../types/order.types';
import {useAppSelector} from '../store/hooks';
import images from '../utils/images';

// 화면 높이 가져오기
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MemberOrdersPopupProps {
  visible: boolean;
  message: string;
  orderList: MemberOrder[];
  selectedOrderId: number | null;
  onSelect: (orderId: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const MemberOrdersPopup: React.FC<MemberOrdersPopupProps> = ({
  visible,
  message,
  orderList,
  selectedOrderId,
  onSelect,
  onConfirm,
  onCancel,
}) => {
  // 리덕스에서 회원 정보 가져오기
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.absolute}>
        <View style={styles.overlay} />
        <View style={styles.contentWrapper}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>회원권 선택</Text>
              <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerBorder} />
            
            <View style={styles.nicknameContainer}>
              <Text style={styles.nicknameText}>{memberInfo?.mem_nickname}님, </Text>
              <Text style={styles.message}>{message}</Text>
            </View>
            
            <ScrollView 
              style={styles.orderScrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.orderScrollContent}
            >
              {orderList.map((order, index) => (
                <TouchableOpacity
                  key={order.memo_id || index}
                  style={[
                    styles.orderItem,
                    selectedOrderId === order.memo_id && styles.selectedOrder,
                  ]}
                  onPress={() => onSelect(order.memo_id)}>
                    <View>
                      <Text style={styles.orderText}>
                      {order.memo_pro_name || order.product_name}
                    </Text>
                    {order.pro_type === '회차권' ? (
                      <Text style={styles.orderText}>
                        남은 횟수: {order.memo_remaining_counts}회
                      </Text>
                    ) : (
                      <Text style={styles.orderText}>
                        {order.memo_start_date || order.start_date} ~{' '}
                        {order.memo_end_date || order.end_date}
                      </Text>
                    )}
                  </View>
                  <Image
                    source={images.icons.arrowRightFullGray}
                    style={styles.arrowRight}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                <Text style={styles.confirmButtonText}>선택</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  contentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    zIndex: 2,
  },
  container: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: scale(12),
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
    marginHorizontal: -scale(12),
  },
  title: {
    color: '#000000',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  closeButton: {
    padding: scale(5),
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: scale(24),
    fontWeight: 'bold',
  },
  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(15),
  },
  nicknameText: {
    color: '#6B7280',
    fontSize: scale(13),
  },
  message: {
    color: '#6B7280',
    fontSize: scale(13),
  },
  orderScrollView: {
    marginBottom: scale(10),
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  orderScrollContent: {
    paddingBottom: scale(10),
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: scale(20),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scale(15),
  },
  selectedOrder: {
    borderColor: '#1D4ED8',
    borderWidth: 1,
  },
  orderText: {
    fontSize: scale(14),
    color: '#000000',
    marginBottom: scale(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1D4ED8',
    paddingVertical: scale(8),
    borderRadius: scale(7),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  arrowRight: {
    width: scale(15),
    height: scale(15),
    marginLeft: scale(5),
  },
});

export default MemberOrdersPopup;
