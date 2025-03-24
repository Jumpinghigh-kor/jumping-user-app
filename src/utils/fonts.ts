// 앱에서 사용할 폰트 스타일을 정의합니다.
export const FONTS = {
  THIN: 'Pretendard-Thin',
  EXTRA_LIGHT: 'Pretendard-ExtraLight',
  LIGHT: 'Pretendard-Light',
  REGULAR: 'Pretendard-Regular',
  MEDIUM: 'Pretendard-Medium',
  SEMI_BOLD: 'Pretendard-SemiBold',
  BOLD: 'Pretendard-Bold',
  EXTRA_BOLD: 'Pretendard-ExtraBold',
  BLACK: 'Pretendard-Black',
};

// 기본 폰트 스타일 (대부분의 텍스트에 사용)
export const DEFAULT_FONT = FONTS.REGULAR;

// 폰트 스타일 생성 함수
export const createFontStyle = (weight: keyof typeof FONTS = 'REGULAR', size = 14) => {
  return {
    fontFamily: FONTS[weight],
    fontSize: size,
  };
};

// 글꼴 관련 유틸리티 함수
export const fontUtils = {
  heading1: createFontStyle('BOLD', 24),
  heading2: createFontStyle('BOLD', 20),
  heading3: createFontStyle('SEMI_BOLD', 18),
  subheading: createFontStyle('MEDIUM', 16),
  body: createFontStyle('REGULAR', 14),
  caption: createFontStyle('REGULAR', 12),
  small: createFontStyle('REGULAR', 10),
};

// 앱 전체에 기본 폰트 적용하는 함수
export const applyDefaultFonts = () => {
  // React Native 컴포넌트에서 사용하는 경우 import 후 직접 호출해야 함
  // 예시: TextInput.defaultProps = { style: { fontFamily: DEFAULT_FONT } };
  return DEFAULT_FONT;
};

export default FONTS; 