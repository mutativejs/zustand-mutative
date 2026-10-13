import { createStore } from 'zustand/vanilla';
import { mutative } from 'zustand-mutative';

const store = createStore<{ count: number; tags: Set<string> }>()(
  mutative(() => ({ count: 0, tags: new Set<string>() }), {
    enableAutoFreeze: true,
  })
);

store.setState((state) => {
  state.count += 1;
  state.tags.add('a');
  // @ts-expect-error the draft keeps the types of the state
  state.count = '1';
});

// @ts-expect-error the middleware always turns patches off
mutative(() => ({}), { enablePatches: true });
