import classes from './App.module.scss';

import { BrowserRouter as Router } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../common/hooks';
import { useEffect } from 'react';
import { setEnvironment } from '../features/layout/layoutSlice';
import {
  authUsername,
  useSetTokenCookie,
  useTryAuthFromToken,
} from '../features/auth/authSlice';
import { useLoggedInProfileUser } from '../features/profile/profileSlice';
import { getCookie } from '../common/cookie';
import { ErrorBoundary } from 'react-error-boundary';

import Routes from './Routes';
import LeftNavBar from '../features/layout/LeftNavBar';
import TopBar from '../features/layout/TopBar';
import ErrorPage from '../features/layout/ErrorPage';

const useInitApp = () => {
  const dispatch = useAppDispatch();

  // Pull token from cookie. If it exists, and differs from state, try it for auth.
  const cookieToken = getCookie('kbase_session');
  const { isLoading } = useTryAuthFromToken(cookieToken);

  // Set the token cookie from auth state
  useSetTokenCookie();

  // Use authenticated username to load user's profile
  const username = useAppSelector(authUsername);
  useLoggedInProfileUser(username);

  // Placeholder code for determining environment.
  useEffect(() => {
    dispatch(setEnvironment('ci'));
  }, [dispatch]);

  return { isLoading };
};

export default function App() {
  const { isLoading } = useInitApp();

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className={classes.container}>
        <div className={classes.topbar}>
          <TopBar />
        </div>
        <div className={classes.site_content}>
          <div className={classes.left_navbar}>
            <LeftNavBar />
          </div>
          <div className={classes.page_content}>
            <ErrorBoundary FallbackComponent={ErrorPage}>
              {isLoading ? 'Loading...' : <Routes />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </Router>
  );
}
