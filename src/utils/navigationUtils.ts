import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthStackNavigator';

// NavigationRef를 저장할 객체
let navigationRef: NavigationContainerRef<any> | null = null;

/**
 * 네비게이션 레퍼런스를 설정하는 함수
 * App.tsx에서 NavigationContainer의 ref로 연결해야 함
 */
export const setNavigationRef = (ref: NavigationContainerRef<any>) => {
  navigationRef = ref;
};

/**
 * 로그인 화면으로 리디렉션하는 함수
 * 토큰 만료 시 호출됨
 */
export const navigateToLogin = () => {
  if (navigationRef) {
    // 네비게이션 스택을 초기화하고 로그인 화면으로 이동
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  }
};

/**
 * 특정 화면으로 이동하는 함수
 */
export const navigate = <T extends keyof AuthStackParamList>(
  name: T, 
  params?: AuthStackParamList[T]
) => {
  if (navigationRef) {
    navigationRef.navigate(name as string, params as any);
  }
}; 