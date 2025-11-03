import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';

interface CommonModalProps {
  visible: boolean;
  title: string;
  content: string;
  height?: string;
  onClose: () => void;
  background?: string;
  textColor?: string;
  textSize?: number;
  children?: React.ReactNode;
}

const CommonModal: React.FC<CommonModalProps> = ({
  visible,
  title,
  content,
  height,
  onClose,
  background = '#333333',
  textColor = '#FFFFFF',
  textSize = scale(14),
  children,
}) => {
  const pan = React.useRef(new Animated.ValueXY()).current;
  
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 10;
        },
        onPanResponderGrant: () => {
          pan.extractOffset();
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            pan.y.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 100) {
            onClose();
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              bounciness: 10,
            }).start();
          }
        },
      }),
    [onClose, pan]
  );

  React.useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
    }
  }, [visible, pan]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: pan.y }],
              backgroundColor: background,
              maxHeight: height ? height : '70%',
              minHeight: height ? height : '70%',
            }
          ]}
        >
          <View
            {...panResponder.panHandlers}
            style={styles.dragArea}
          >
            <View style={styles.modalBarContainer}>
              <Image source={IMAGES.icons.smallBarGray} style={styles.modalBar} />
            </View>
          </View>
          
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor, }]}>{title}</Text>
          </View>
          
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            {children ? (
              children
            ) : (
              <Text style={[styles.modalText, { color: textColor, fontSize: textSize }]}>{content}</Text>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333333',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    width: '100%',
    padding: scale(20),
  },
  dragArea: {
    width: '100%',
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -scale(10),
    marginBottom: scale(5),
  },
  modalBarContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: scale(15),
  },
  modalBar: {
    width: scale(40),
    height: scale(4),
    resizeMode: 'contain',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(15),
    position: 'relative',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontFamily: 'Pretendard-SemiBold',
  },
  modalScrollView: {
    maxHeight: '90%',
    marginBottom: scale(10),
  },
  modalText: {
    color: '#FFFFFF',
    lineHeight: scale(22),
    paddingBottom: scale(20),
  },
});

export default CommonModal; 