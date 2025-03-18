import { configureStore } from '@reduxjs/toolkit';
import memberReducer from './slices/memberSlice';

// 스토어 생성
const store = configureStore({
  reducer: {
    member: memberReducer,
    // 다른 리듀서들을 여기에 추가
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// 루트 리듀서 타입
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 