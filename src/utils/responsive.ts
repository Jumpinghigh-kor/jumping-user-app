import {Dimensions} from 'react-native';

// 화면 크기 가져오기
export const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 반응형 크기 계산 함수
export const scale = (size: number) => (SCREEN_WIDTH / 375) * size;

// 수직 방향 반응형 크기 계산 함수 (필요시 사용)
export const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;

// 텍스트 크기 반응형 계산 함수 (필요시 사용)
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor; 