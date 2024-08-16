import { FC, ReactElement } from 'react';
import {
  createSearchParams,
  Navigate,
  Route,
  Routes as RRRoutes,
  useLocation,
} from 'react-router-dom';
import {
  CollectionsList,
  CollectionDetail,
  detailPath,
  detailDataProductPath,
} from '../features/collections/Collections';
import Legacy, { LEGACY_BASE_ROUTE } from '../features/legacy/Legacy';
import { Fallback } from '../features/legacy/IFrameFallback';
import Navigator, {
  navigatorPath,
  navigatorPathWithCategory,
} from '../features/navigator/Navigator';
import PageNotFound from '../features/layout/PageNotFound';
import ProfileWrapper from '../features/profile/Profile';
import Status from '../features/status/Status';
import {
  useAppSelector,
  useFilteredParams,
  usePageTracking,
} from '../common/hooks';
import ORCIDLinkFeature from '../features/orcidlink';
import { LogIn } from '../features/login/LogIn';
import { LogInContinue } from '../features/login/LogInContinue';
import ORCIDLinkCreateLink from '../features/orcidlink/CreateLink';
import { LoggedOut } from '../features/login/LoggedOut';

export const LOGIN_ROUTE = '/login';
export const ROOT_REDIRECT_ROUTE = '/narratives';

const Routes: FC = () => {
  useFilteredParams();
  usePageTracking();
  return (
    <RRRoutes>
      <Route path={`${LEGACY_BASE_ROUTE}/*`} element={<Legacy />} />
      <Route path="/status" element={<Status />} />
      <Route
        path="/profile/:usernameRequested/narratives"
        element={<Authed element={<ProfileWrapper />} />}
      />
      <Route
        path="/profile/:usernameRequested"
        element={<Authed element={<ProfileWrapper />} />}
      />
      <Route
        path="/profile"
        element={<Authed element={<ProfileWrapper />} />}
      />

      {/* Log In */}
      <Route path="/login" element={<LogIn />} />
      <Route path="/login/continue" element={<LogInContinue />} />
      <Route path="/loggedout" element={<LoggedOut />} />

      {/* Navigator */}
      <Route
        path={navigatorPath}
        element={<Authed element={<Navigator />} />}
      />
      <Route
        path={'/narratives/:category'}
        element={<Authed element={<Navigator />} />}
      />
      <Route
        path={navigatorPathWithCategory}
        element={<Authed element={<Navigator />} />}
      />
      <Route path="/narratives" element={<Authed element={<Navigator />} />} />

      {/* Collections */}
      <Route path="/collections">
        <Route index element={<Authed element={<CollectionsList />} />} />
        <Route
          path={detailPath}
          element={<Authed element={<CollectionDetail />} />}
        />
        <Route
          path={detailDataProductPath}
          element={<Authed element={<CollectionDetail />} />}
        />
        <Route path="*" element={<PageNotFound />} />
      </Route>

      {/* orcidlink */}
      <Route path="/orcidlink">
        <Route index element={<Authed element={<ORCIDLinkFeature />} />} />
      </Route>
      <Route path="/orcidlink/link">
        <Route index element={<Authed element={<ORCIDLinkCreateLink />} />} />
      </Route>

      {/* IFrame Fallback Routes */}
      <Route path="/fallback">
        <Route
          path="narratives"
          element={<Fallback redirect={() => '/narratives'} />}
        />
        <Route
          path="narrative/:wsId"
          element={
            <Fallback
              reload
              redirect={(params) => `/narrative/${params.wsId}`}
            />
          }
        />
        <Route path="*" element={<Fallback redirect={() => null} />} />
      </Route>

      <Route path="/" element={<HashRouteRedirect />} />
      <Route path="*" element={<PageNotFound />} />
    </RRRoutes>
  );
};

export const Authed: FC<{ element: ReactElement }> = ({ element }) => {
  const token = useAppSelector((state) => state.auth.token);
  const location = useLocation();
  if (!token)
    return (
      <Navigate
        to={{
          pathname: LOGIN_ROUTE,
          search: createSearchParams({
            nextRequest: JSON.stringify(location),
          }).toString(),
        }}
        replace
      />
    );

  return <>{element}</>;
};

export const HashRouteRedirect = () => {
  const location = useLocation();
  if (location.hash)
    return (
      <Navigate to={`${LEGACY_BASE_ROUTE}/${location.hash.slice(1)}`} replace />
    );
  return <Navigate to={ROOT_REDIRECT_ROUTE} replace />;
};

export default Routes;
