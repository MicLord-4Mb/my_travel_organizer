import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed Redux dispatch hook.
 * Prefer this hook over plain `useDispatch` to ensure actions and thunks are correctly typed.
 *
 * @returns {AppDispatch} Typed Redux store dispatch function.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed Redux selector hook.
 * Pre-typed with `RootState` to avoid repeating `(state: RootState)` in every selector.
 *
 * @type {TypedUseSelectorHook<RootState>}
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
