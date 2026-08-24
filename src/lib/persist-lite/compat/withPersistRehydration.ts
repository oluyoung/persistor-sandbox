import type { AnyAction, Reducer } from "redux";
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
  reducer: Reducer<TState, AnyAction>,
  options: RehydrationOptions<TState> = {},
): Reducer<TState, AnyAction> {
  const { reconcile = mergeLevel1 } = options;

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

function mergeLevel1<TState>(
  currentState: TState,
  persistedState: Partial<TState>,
): TState {
  return {
    ...currentState,
    ...persistedState,
  };
}
