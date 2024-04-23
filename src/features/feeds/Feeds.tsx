import { FC } from 'react';
import { usePageTitle } from '../layout/layoutSlice';
import FeedTabs from './FeedTabs';
import { getFeeds } from '../../common/api/feedsService';

const feedsPath = '/feeds';

const Feeds: FC = () => {
  usePageTitle('Notification Feeds');
  const { data: feedsData } = getFeeds.useQuery({});
  return (
    <>
      <h1>Hello I am Feeds.</h1>
      <FeedTabs userId="foo" isAdmin={false} feeds={feedsData}></FeedTabs>
    </>
  );
};

export { feedsPath };
export default Feeds;
