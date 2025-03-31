import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import { useNavigation } from '@react-navigation/native';

interface CommonHeaderProps {
  onBackPress?: () => void;
  showBackButton?: boolean;
  title: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  onBackPress, 
  showBackButton = true,
  title
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
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Image source={IMAGES.icons.arrowLeftWhite} style={styles.backIcon} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.emptyArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(20),
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
    color: '#FFFFFF',
    width: '33.3%',
    textAlign: 'center',
  },
  emptyArea: {
    width: '33.3%',
  },
});

export default CommonHeader; 