import { createAction } from '@reduxjs/toolkit';

export const rehydrate = createAction<Record<string, unknown>>(
  '@@PERSIST/REHYDRATE',
);

export const persistPurge = createAction<string[] | undefined>(
  '@@PERSIST/PURGE',
);
