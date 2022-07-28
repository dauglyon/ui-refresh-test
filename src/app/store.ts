import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import count from '../features/count/countSlice';
import icons from '../common/slices/iconSlice';
import layout from '../features/layout/layoutSlice';
import profile from '../features/profile/profileSlice';
import { apiReducers, apiMiddleware } from '../common/api';

const createStore = <T>(additionalOptions?: T) => {
  return configureStore({
    devTools: true,
    reducer: { auth, count, icons, layout, profile, ...apiReducers },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(...apiMiddleware),
    ...additionalOptions,
  });
};

export const store = createStore();

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const createTestStore = (preloadedState: Partial<RootState>) => {
  return createStore({ preloadedState: preloadedState });
};
