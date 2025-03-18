import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getMemberInfo, MemberInfo } from '../../api/services/membersService';

// 상태 타입 정의
interface MemberState {
  memberInfo: MemberInfo | null;
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: MemberState = {
  memberInfo: null,
  loading: false,
  error: null,
};

// 비동기 액션 생성
export const fetchMemberInfo = createAsyncThunk(
  'member/fetchMemberInfo',
  async (mem_id: string, { rejectWithValue }) => {
    try {
      const response = await getMemberInfo({ mem_id });
      if (!response.success) {
        return rejectWithValue(response.message || '회원 정보를 가져오는데 실패했습니다.');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '회원 정보를 가져오는데 실패했습니다.');
    }
  }
);

// 슬라이스 생성
const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    clearMemberInfo: (state) => {
      state.memberInfo = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMemberInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberInfo.fulfilled, (state, action: PayloadAction<MemberInfo>) => {
        state.loading = false;
        state.memberInfo = action.payload;
      })
      .addCase(fetchMemberInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 액션 내보내기
export const { clearMemberInfo } = memberSlice.actions;

// 리듀서 내보내기
export default memberSlice.reducer; 