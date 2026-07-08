// ** Packages **
import { useSelector, type TypedUseSelectorHook } from 'react-redux';

// ** Redux **
import type { RootStateType } from './store';

// `useAppDispatch` is exported from store.ts (repo convention).
// Typed selector hook lives here — use it everywhere instead of plain useSelector.
export const useAppSelector: TypedUseSelectorHook<RootStateType> = useSelector;
