/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyAction } from 'redux';
import { REHYDRATE } from '../lib/persist-lite';

interface UserState {
  me: any;
  count: number;
  fetchRequest?: any;
}

const initialState: UserState = {
  me: {},
  count: 0,
  fetchRequest: {
    loading: 'idle',
  },
};

export const SET_USER = 'user/setUser';
export const UPDATE_COUNT = 'user/updateCount';
export const FETCH_USER_PENDING = 'user/fetchUser/pending';
export const FETCH_USER_FULFILLED = 'user/fetchUser/fulfilled';
export const FETCH_USER_REJECTED = 'user/fetchUser/rejected';

export interface SetUserAction {
  type: typeof SET_USER;
  payload: any;
}

export interface UpdateCountAction {
  type: typeof UPDATE_COUNT;
}

export interface FetchUserPendingAction {
  type: typeof FETCH_USER_PENDING;
  meta: { requestId: string };
}

export interface FetchUserFulfilledAction {
  type: typeof FETCH_USER_FULFILLED;
  payload: any;
  meta: { requestId: string };
}

export interface FetchUserRejectedAction {
  type: typeof FETCH_USER_REJECTED;
  error: any;
  meta: { requestId: string };
}

export type UserAction =
  | SetUserAction
  | UpdateCountAction
  | FetchUserPendingAction
  | FetchUserFulfilledAction
  | FetchUserRejectedAction;

export function setUser(payload: any): SetUserAction {
  return {
    type: SET_USER,
    payload,
  };
}

export function updateCount() {
  return {
    type: UPDATE_COUNT,
  };
}

export function fetchUserPending(requestId: string): FetchUserPendingAction {
  return {
    type: FETCH_USER_PENDING,
    meta: { requestId },
  };
}

export function fetchUserFulfilled(
  payload: any,
  requestId: string
): FetchUserFulfilledAction {
  return {
    type: FETCH_USER_FULFILLED,
    payload,
    meta: { requestId },
  };
}

export function fetchUserRejected(
  error: any,
  requestId: string
): FetchUserRejectedAction {
  return {
    type: FETCH_USER_REJECTED,
    error,
    meta: { requestId },
  };
}

let requestIdCounter = 0;

function nextRequestId(): string {
  requestIdCounter += 1;
  return `fetchUser-${requestIdCounter}`;
}

export function fetchUser(): any {
  return async (dispatch: any, getState: any) => {
    const requestId = nextRequestId();

    dispatch(fetchUserPending(requestId));

    const { loading, currentRequestId } = getState()?.user?.fetchRequest || {};

    if (loading !== 'pending' || requestId !== currentRequestId) {
      return getState().user.me;
    }

    try {
      const user = await Promise.resolve({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
      });
      dispatch(fetchUserFulfilled(user, requestId));
      return user;
    } catch (error) {
      dispatch(fetchUserRejected(error, requestId));
      throw error;
    }
  };
}

export default function userReducer(
  state: UserState = initialState,
  action: AnyAction
): UserState {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        me: action.payload,
      };

    case UPDATE_COUNT:
      return {
        ...state,
        count: state.count + 1,
      };

    case FETCH_USER_PENDING:
      if (state?.fetchRequest?.loading === 'idle') {
        return {
          ...state,
          fetchRequest: {
            loading: 'pending',
            currentRequestId: action.meta.requestId,
          },
        };
      }
      return state;

    case FETCH_USER_FULFILLED:
      if (
        state.fetchRequest?.loading === 'pending' &&
        state.fetchRequest?.currentRequestId === action.meta.requestId
      ) {
        return {
          ...state,
          me: action.payload,
          fetchRequest: {
            ...state.fetchRequest,
            loading: 'idle',
            currentRequestId: undefined,
          },
        };
      }
      return state;

    case FETCH_USER_REJECTED:
      if (
        state.fetchRequest?.loading === 'pending' &&
        state.fetchRequest?.currentRequestId === action.meta.requestId
      ) {
        console.error(action.error);
        return {
          ...state,
          fetchRequest: {
            ...state.fetchRequest,
            loading: 'idle',
            error: action.error,
            currentRequestId: undefined,
          },
        };
      }
      return state;

    case REHYDRATE: {
      const user = action.payload?.user as UserState | undefined;
      return { ...state, ...user }; // merge, not replace
    }

    default:
      return state;
  }
}
