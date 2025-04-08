import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
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
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  onBackPress, 
  showBackButton = true,
  title,
  backIcon = IMAGES.icons.arrowLeftWhite,
  titleColor = '#FFFFFF',
  rightIcon,
  backgroundColor = '#202020'
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
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
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <View style={styles.emptyArea}>
        {rightIcon}
      </View>
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
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  title: {
    fontSize: scale(16),
    fontWeight: '500',
    width: '33.3%',
    textAlign: 'center',
  },
  emptyArea: {
    width: '33.3%',
    alignItems: 'flex-end',
  },
});

export default CommonHeader; 