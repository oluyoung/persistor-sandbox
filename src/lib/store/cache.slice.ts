/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CacheState {
  cache: any;
}

const initialState: CacheState = {
  cache: [],
};

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    setCache(state, action: PayloadAction<any>) {
      state.cache = action.payload;
    },
  },
});


export const {
  setCache,
  // clearLocalVehicles,
} = cacheSlice.actions;

export default cacheSlice.reducer;
