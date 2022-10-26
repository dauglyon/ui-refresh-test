import { Button } from '../../common/components';
import { useAppSelector, useAppDispatch } from '../../common/hooks';
import { usePageTitle } from '../layout/layoutSlice';
import { countStatus, increment } from '../count/countSlice';

const Counter = () => {
  const currentCount = useAppSelector(countStatus);
  return <>{currentCount}</>;
};

export default function Count() {
  usePageTitle('Count');
  const dispatch = useAppDispatch();
  const doIncrement = () => {
    dispatch(increment());
  };
  return (
    <section>
      <h2>
        The count is: <Counter />
      </h2>
      <Button onClick={() => doIncrement()}>Add</Button>
    </section>
  );
}
