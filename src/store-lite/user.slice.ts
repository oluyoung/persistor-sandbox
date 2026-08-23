/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { rehydrate } from "../lib/persist-lite";

interface UserState {
  me: any;
  count: number;
  fetchRequest?: any;
}

const initialState: UserState = {
  me: {},
  count: 0,
  fetchRequest: {
    loading: "idle",
  },
};

export const fetchUser = createAsyncThunk(
  `user/fetchUser`,
  async (token: string | null, { getState, requestId }: any) => {
    const { loading, currentRequestId } =
      getState()?.user?.fetchRequest || {};
    if (loading !== "pending" || requestId !== currentRequestId) return getState().user.me;
    return await Promise.resolve({
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "123-456-7890",
    })
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<any>) {
      state.me = action.payload;
    },
    updateCount(state) {
      state.count++;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state, action) => {
        if (state?.fetchRequest?.loading === "idle") {
          state.fetchRequest = {
            loading: "pending",
            currentRequestId: action.meta.requestId,
          };
        }
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        const { requestId } = action.meta;
        if (
          state.fetchRequest?.loading === 'pending' &&
          state.fetchRequest?.currentRequestId === requestId
        ) {
          state.me = action.payload;
          state.fetchRequest.loading = 'idle';
          state.fetchRequest.currentRequestId = undefined;
        }
      })
      .addCase(fetchUser.rejected, (state, action) => {
        const { requestId } = action.meta;
        if (
          state.fetchRequest?.loading === "pending" &&
          state.fetchRequest?.currentRequestId === requestId
        ) {
          console.error(action.error);
          state.fetchRequest.loading = "idle";
          state.fetchRequest.error = action.error;
          state.fetchRequest.currentRequestId = undefined;
        }
      }).addCase(rehydrate, (state, action) => {
        const user = action.payload?.user as UserState | undefined;
        return { ...state, ...user }; // merge, not replace
      });
  },
});

export const {
  setUser,
  updateCount
} = userSlice.actions;

export default userSlice.reducer;
