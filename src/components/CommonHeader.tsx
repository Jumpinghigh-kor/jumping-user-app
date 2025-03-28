import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';

interface CommonHeaderProps {
  onBackPress: () => void;
  showBackButton?: boolean;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  onBackPress, 
  showBackButton = true 
}) => {
  return (
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity
          onPress={onBackPress}
        >
          <Image source={IMAGES.icons.arrowLeftWhite} style={styles.backIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
});

export default CommonHeader; 