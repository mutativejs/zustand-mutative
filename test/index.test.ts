import { create } from 'zustand';
import { act, renderHook } from '@testing-library/react';

import { mutative } from '../src';

test('Updating simple states', () => {
  type State = {
    count: number;
  };

  type Actions = {
    increment: (qty: number) => void;
    decrement: (qty: number) => void;
  };

  const useCountStore = create<State & Actions>()(
    mutative((set) => ({
      count: 0,
      increment: (qty: number) =>
        set((state) => {
          state.count += qty;
        }),
      decrement: (qty: number) =>
        set((state) => {
          state.count -= qty;
        }),
    }))
  );

  const { result } = renderHook(() => useCountStore());
  const { increment, decrement } = result.current;

  act(() => increment(1));
  expect(result.current.count).toBe(1);

  act(() => decrement(1));
  expect(result.current.count).toBe(0);
});
