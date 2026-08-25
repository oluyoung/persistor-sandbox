import type { Reducer, UnknownAction } from "redux";
import {
  REHYDRATE,
  PERSIST_PURGE,
  PERSIST_RESET,
  PERSIST_BASE,
} from "../actions";

export interface RehydrationOptions<TState> {
  reconcile?: (currentState: TState, persistedState: Partial<TState>) => TState;
}

export function withPersistRehydration<TState>(
  reducer: Reducer<TState, UnknownAction>,
  options: RehydrationOptions<TState> = {},
): Reducer<TState, UnknownAction> {
  const { reconcile = defaultReconciler } = options;

  return (state, action) => {
    if (action.type === REHYDRATE && action.payload) {
      const baseState = reducer(state, { type: PERSIST_BASE });
      return reconcile(baseState, action.payload);
    }

    if (action.type === PERSIST_PURGE) {
      return reducer(undefined, { type: PERSIST_RESET });
    }

    return reducer(state, action);
  };
}

function defaultReconciler<TState>(
  currentState: TState,
  persistedState: Partial<TState>,
): TState {
  if (!persistedState || typeof persistedState !== "object") {
    return currentState;
  }

  if (!currentState || typeof currentState !== "object") {
    return persistedState as TState;
  }

  return {
    ...currentState,
    ...persistedState,
  };
}
