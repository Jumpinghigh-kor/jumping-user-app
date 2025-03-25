import React, {ReactNode} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';

type PopupType = 'default' | 'warning' | 'confirm';

interface CommonPopupProps {
  visible: boolean;
  title?: string;
  message: string;
  type?: PopupType;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: ReactNode;
}

const CommonPopup = ({
  visible,
  title,
  message,
  type = 'default',
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  children,
}: CommonPopupProps) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.messageContainer}>
          {type === 'warning' && (
            <View style={styles.iconContainer}>
              <Image 
                source={IMAGES.icons.exclamationMarkRed} 
                style={styles.warningIcon} 
                resizeMode="contain"
              />
            </View>
          )}
          <Text style={styles.message}>{message}</Text>
          </View>
          {children}
          <View style={styles.buttonContainer}>
            {(onCancel || type === 'confirm') && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(10),
    padding: scale(20),
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(15),
  },
  iconContainer: {
  },
  warningIcon: {
    width: scale(18),
    height: scale(18),
    marginRight: scale(5),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  message: {
    fontSize: scale(14),
    textAlign: 'center',
    color: '#333333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: scale(7),
    borderRadius: scale(5),
    alignItems: 'center',
    marginHorizontal: scale(5),
  },
  cancelButton: {
    backgroundColor: '#DDDDDD',
  },
  confirmButton: {
    backgroundColor: '#6BC46A',
  },
  cancelButtonText: {
    color: '#333333',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(12),
  },
});

export default CommonPopup; 