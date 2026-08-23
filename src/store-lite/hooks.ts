import { useDispatch as useReduxDispatch, useSelector as useReduxSelector, useStore as useReduxStore } from 'react-redux';
import type { ReduxRootStore, RootState, AppDispatch } from '.';

export const useAppDispatch = useReduxDispatch.withTypes<AppDispatch>();
export const useAppSelector = useReduxSelector.withTypes<RootState>();
export const useAppStore = useReduxStore.withTypes<ReduxRootStore>();
