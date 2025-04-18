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
  backgroundColor?: string;
  textColor?: string;
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
  backgroundColor,
  textColor,
}: CommonPopupProps) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.container, backgroundColor ? { backgroundColor } : null]}>
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
          <Text style={[styles.message, textColor ? { color: textColor } : null]}>{message}</Text>
          </View>
          {children}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
            {(onCancel || type === 'confirm') && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#373737',
    borderRadius: scale(20),
    paddingHorizontal: scale(20),
    paddingVertical: scale(40),
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(25),
  },
  iconContainer: {
    marginRight: scale(8),
  },
  warningIcon: {
    width: scale(20),
    height: scale(20),
    // marginRight: scale(3),
    resizeMode: 'contain',
  },
  message: {
    fontSize: scale(14),
    textAlign: 'center',
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    paddingVertical: scale(7),
    paddingHorizontal: scale(30),
    borderRadius: scale(30),
    marginHorizontal: scale(5),
  },
  cancelButton: {
    backgroundColor: '#848484',
  },
  confirmButton: {
    backgroundColor: '#43B546',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(14),
  },
});

export default CommonPopup; 