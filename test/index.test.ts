import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
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

test('Freezing the next state with enableAutoFreeze', () => {
  type State = {
    todos: { text: string; done: boolean }[];
    tags: Set<string>;
    owners: Map<string, { name: string }>;
    addTodo: (text: string) => void;
  };

  const store = createStore<State>()(
    mutative(
      (set) => ({
        todos: [],
        tags: new Set(),
        owners: new Map([['a', { name: 'Alice' }]]),
        addTodo: (text) =>
          set((state) => {
            state.todos.push({ text, done: false });
            state.tags.add(text);
            state.owners.get('a')!.name = text;
          }),
      }),
      { enableAutoFreeze: true }
    )
  );

  store.getState().addTodo('a');
  let state = store.getState();
  expect(Object.isFrozen(state.todos)).toBe(true);
  expect(Object.isFrozen(state.todos[0])).toBe(true);
  // Mutative 2 freezes Map and Set instances themselves.
  expect(Object.isFrozen(state.tags)).toBe(true);
  expect(Object.isFrozen(state.owners)).toBe(true);
  expect(Object.isFrozen(state.owners.get('a'))).toBe(true);

  // A frozen state is drafted again by the next update.
  store.getState().addTodo('b');
  state = store.getState();
  expect(state.todos).toEqual([
    { text: 'a', done: false },
    { text: 'b', done: false },
  ]);
  expect([...state.tags]).toEqual(['a', 'b']);
  expect(state.owners.get('a')).toEqual({ name: 'b' });
  expect(Object.isFrozen(state.tags)).toBe(true);
});

test('Updating arrays, Maps and Sets', () => {
  type State = {
    queue: { id: number }[];
    users: Map<number, { name: string }>;
    selected: Set<number>;
    other: { value: number };
  };

  const store = createStore<State>()(
    mutative(() => ({
      queue: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      users: new Map([
        [1, { name: 'a' }],
        [2, { name: 'b' }],
      ]),
      selected: new Set([1]),
      other: { value: 0 },
    }))
  );

  const prev = store.getState();
  store.setState((state) => {
    // Mutative 2 runs these array methods natively on the draft's copy.
    const first = state.queue.shift()!;
    state.queue.push(first);
    state.queue.unshift({ id: 0 });
    state.queue.splice(2, 1);
    state.queue.reverse();
    state.users.get(1)!.name = 'A';
    state.users.delete(2);
    state.selected.add(2);
  });

  const next = store.getState();
  expect(next.queue).toEqual([{ id: 1 }, { id: 4 }, { id: 2 }, { id: 0 }]);
  expect(next.queue[0]).toBe(prev.queue[0]);
  expect(next.queue[1]).toBe(prev.queue[3]);
  expect([...next.users]).toEqual([[1, { name: 'A' }]]);
  expect([...next.selected]).toEqual([1, 2]);
  expect(next.other).toBe(prev.other);
  expect(prev.queue).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
  expect(prev.users.get(1)).toEqual({ name: 'a' });
  expect([...prev.selected]).toEqual([1]);
});

test('Keeping the state when a recipe fails', () => {
  type State = {
    count: number;
    list: number[];
  };

  const store = createStore<State>()(
    mutative(() => ({
      count: 0,
      list: [1],
    }))
  );
  const state = store.getState();

  expect(() =>
    store.setState((draft) => {
      draft.list.push(2);
      throw new Error('failed');
    })
  ).toThrow('failed');
  expect(store.getState()).toBe(state);

  // Mutative throws for a recipe that changes the draft and returns another
  // value, with a minified error code in production builds.
  expect(() =>
    store.setState((draft) => {
      draft.count += 1;
      return { count: 1 };
    })
  ).toThrow(
    /Either the value is returned as a new non-draft value|Minified Mutative error #5;/
  );
  expect(store.getState()).toBe(state);
  expect(state).toEqual({ count: 0, list: [1] });
});
