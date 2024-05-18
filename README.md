# zustand-mutative

![Node CI](https://github.com/mutativejs/zustand-mutative/workflows/Node%20CI/badge.svg)
[![npm](https://img.shields.io/npm/v/zustand-mutative.svg)](https://www.npmjs.com/package/zustand-mutative)
![license](https://img.shields.io/npm/l/zustand-mutative)

A [Mutative](https://github.com/unadlib/mutative) middleware for Zustand enhances the efficiency of immutable state updates.

With the Mutative middleware, you can simplify the handling of immutable data in Zustand in a mutable way, allowing you to use immutable state more conveniently.

`zustand-mutative` is 2-6x faster than zustand with spread operation, more than 10x faster than `zustand/middleware/immer`. [Read more about the performance comparison in Mutative](https://mutative.js.org/docs/getting-started/performance).

## Installation

In order to use the Mutative middleware in Zustand, you will need to install Mutative and Zustand as a direct dependency.

```bash
npm install zustand-mutative zustand mutative
# Or use any package manager of your choice.
```

## Usage

```typescript
import { create } from 'zustand';
import { mutative } from 'zustand-mutative';

type State = {
  count: number;
};

type Actions = {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
};

export const useCountStore = create<State & Actions>()(
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
```

## Credits
`zustand-mutative` is inspired by `zustand/middleware/immer`. 

## License
`zustand-mutative` is [MIT licensed](https://github.com/mutativejs/zustand-mutative/blob/main/LICENSE).
