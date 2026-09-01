/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";

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
    setCache(state, action) {
      state.cache = action.payload;
    },
  },
});

export const {
  setCache,
} = cacheSlice.actions;

export default cacheSlice.reducer;
