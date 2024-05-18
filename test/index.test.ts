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

test('Updating simple states with options', () => {
  class Counter {
    value: number;
    constructor(value: number) {
      this.value = value;
    }
  }

  type State = {
    count: {
      value: number;
      instance: Counter;
    };
  };

  type Actions = {
    increment: (qty: number) => void;
    decrement: (qty: number) => void;
  };

  const useCountStore = create<State & Actions>()(
    mutative(
      (set) => ({
        count: {
          value: 0,
          instance: new Counter(0),
        },
        increment: (qty: number) =>
          set((state) => {
            state.count.value += qty;
            state.count.instance.value += qty;
          }),
        decrement: (qty: number) =>
          set((state) => {
            state.count.value -= qty;
            state.count.instance.value -= qty;
          }),
      }),
      {
        mark: () => 'immutable',
      }
    )
  );

  const { result } = renderHook(() => useCountStore());
  const { increment, decrement } = result.current;

  let currentCount = result.current.count;
  act(() => increment(1));
  expect(currentCount).not.toBe(result.current.count);
  expect(currentCount.instance).not.toBe(result.current.count.instance);
  expect(result.current.count.value).toBe(1);
  expect(result.current.count.instance.value).toBe(1);

  act(() => decrement(1));
  expect(currentCount).not.toBe(result.current.count);
  expect(currentCount.instance).not.toBe(result.current.count.instance);
  expect(result.current.count.value).toBe(0);
  expect(result.current.count.instance.value).toBe(0);
});
