import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { RootState } from '../../app/store';
import { getUserProfile } from '../../common/api/userProfileApi';
import { useAppDispatch, useAppSelector } from '../../common/hooks';

// Define a type for the slice state
export interface ProfileState {
  loggedInProfile?: {
    user: {
      username: string;
      realname: string;
    };
    profile: unknown;
  };
}

const initialState: ProfileState = {
  loggedInProfile: undefined,
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setLoggedInProfile: (
      state,
      action: PayloadAction<ProfileState['loggedInProfile']>
    ) => {
      state.loggedInProfile = action.payload;
    },
  },
});

export default profileSlice.reducer;
const { setLoggedInProfile } = profileSlice.actions;

export const profileRealname = ({ profile }: RootState) =>
  profile.loggedInProfile?.user?.realname;

export const useLoggedInProfileUser = (username?: string) => {
  const dispatch = useAppDispatch();
  const args = useMemo(() => ({ usernames: [username || ''] }), [username]);
  const query = getUserProfile.useQuery(args, { skip: !username });
  const profileUser = useAppSelector(
    ({ profile }) => profile.loggedInProfile?.user.username
  );

  // App should crash if profile cant load
  if (query.isError) throw query.error;

  // Set the logged in profile once it loads
  if (query.isSuccess && query.data[0][0].user.username !== profileUser)
    dispatch(setLoggedInProfile(query.data[0][0]));

  return query;
};
