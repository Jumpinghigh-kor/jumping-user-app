import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text, Platform } from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import { useNavigation } from '@react-navigation/native';

interface CommonHeaderProps {
  onBackPress?: () => void;
  showBackButton?: boolean;
  title: string;
  backIcon?: any; // Allow custom back icon
  titleColor?: string; // Allow custom title color
  rightIcon?: React.ReactNode; // Add right icon support
  backgroundColor?: string; // Add background color prop
  onCleanup?: () => void; // Add cleanup function prop for file deletion
  titleWidth?: string;
  emptyAreaWidth?: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  onBackPress, 
  showBackButton = true,
  title,
  backIcon = IMAGES.icons.arrowLeftWhite,
  titleColor = '#FFFFFF',
  rightIcon,
  backgroundColor = '#202020',
  onCleanup,
  titleWidth = '33.3%',
  emptyAreaWidth = '33.3%'
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    // cleanup 함수가 있으면 먼저 실행
    if (onCleanup) {
      onCleanup();
    }
    
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const goHome = () => {
    
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Image source={backIcon} style={styles.backIcon} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, { color: titleColor, width: titleWidth }]}>{title}</Text>
      <TouchableOpacity style={[styles.emptyArea, { width: emptyAreaWidth }]} onPress={goHome}>
        {rightIcon}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(20),
    paddingHorizontal: scale(16),
  },
  backButton: {
    width: '33.3%',
  },
  backIcon: {
    width: scale(24),
    height: scale(24),
    resizeMode: 'contain',
  },
  title: {
    fontSize: scale(16),
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyArea: {
    alignItems: 'flex-end',
  },
});

export default CommonHeader; 