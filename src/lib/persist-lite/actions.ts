import { createAction } from '@reduxjs/toolkit';

export const rehydrate = createAction<Record<string, unknown>>(
  '@@PERSIST/REHYDRATE',
);

export const persistPurge = createAction<string[] | undefined>(
  '@@PERSIST/PURGE',
);

export const REHYDRATE = rehydrate.type;
export const PERSIST_PURGE = persistPurge.type;
export const PERSIST_BASE = '@@PERSIST/BASE';
export const PERSIST_RESET = '@@PERSIST/RESET';