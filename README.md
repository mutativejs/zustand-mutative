# zustand-mutative

![Node CI](https://github.com/mutativejs/zustand-mutative/workflows/Node%20CI/badge.svg)
[![npm](https://img.shields.io/npm/v/zustand-mutative.svg)](https://www.npmjs.com/package/zustand-mutative)
![license](https://img.shields.io/npm/l/zustand-mutative)

A [Mutative](https://github.com/unadlib/mutative) middleware for Zustand enhances the efficiency of immutable state updates.

With the Mutative middleware, you can simplify the handling of immutable data in Zustand in a mutable way, allowing you to use immutable state more conveniently.

## Performance

`zustand-mutative` runs the recipes that `set()` receives with Mutative 2, where `zustand/middleware/immer` runs them with Immer. In [Mutative's benchmark](https://mutative.js.org/docs/getting-started/performance) of 97 workloads, Mutative 2.0 was about 3.6x as fast as Immer 11.1.18 with matched settings, and 6.6x as fast with each library's defaults, under which Immer freezes the next state and Mutative does not (geometric means). A hand-written reducer that copies only what it changes was faster still in most of those workloads. The [performance summary](https://github.com/unadlib/mutative/blob/main/perf-testing/reports/SUMMARY.md) has the complete results, the method and their limits.

## Installation

In order to use the Mutative middleware in Zustand, you will need to install Mutative and Zustand as a direct dependency.

```bash
npm install zustand-mutative zustand mutative
# Or use any package manager of your choice.
```

| zustand-mutative | mutative |
| ---------------- | -------- |
| 2.x              | 2.x      |
| 1.x              | 1.x      |

### Upgrading to Mutative v2

`zustand-mutative` 2.x declares `mutative` ^2.0.0 as its peer dependency, so upgrade both together:

```bash
npm install zustand-mutative@2 mutative@2
```

The middleware API is unchanged: `set()` takes the same recipes, and `mutative()` takes the same options. The Mutative changes that can affect a store are:

- With `enableAutoFreeze: true`, Map and Set instances in the state are frozen too, so adding a property to them or replacing one of their methods fails.
- Mutative selects its development or production build from `process.env.NODE_ENV`. Define it in every bundle, including bundles for Node.js, and in production, match errors by their `Minified Mutative error #<code>` codes instead of their messages.
- Mutative targets ES2018, and so does `zustand-mutative`; transpile both for older engines. Without a bundler, map `mutative` to its production ESM build, `mutative/dist/mutative.esm.production.min.mjs`, as its default ESM build reads `process`, or load its UMD build, which defines the `Mutative` global that the UMD build of `zustand-mutative` reads.

See the [migration guide](https://mutative.js.org/docs/advanced-guides/migration-v2/) for every change in Mutative v2.

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

### Mutative Options

- [Strict mode](https://mutative.js.org/docs/advanced-guides/strict-mode)
- [Auto Freeze](https://mutative.js.org/docs/advanced-guides/auto-freeze)
- [Marking data structure](https://mutative.js.org/docs/advanced-guides/mark)

With `enableAutoFreeze: true`, the values that the state holds are frozen, but the root state object stays unfrozen unless `set()` replaces the state, as in `set(recipe, true)`: by default, Zustand merges the next state into a new root object.

## Credits

`zustand-mutative` is inspired by `zustand/middleware/immer`.

## License

`zustand-mutative` is [MIT licensed](https://github.com/mutativejs/zustand-mutative/blob/main/LICENSE).
