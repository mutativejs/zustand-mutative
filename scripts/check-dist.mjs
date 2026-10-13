// Loads the built package by its name with import and require, as consumers
// do, and fails on the warning that Node.js prints when it has to detect that
// a file is ESM.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const warnings = [];
process.on('warning', (warning) => {
  if (warning.code === 'MODULE_TYPELESS_PACKAGE_JSON') {
    warnings.push(String(warning));
  }
});

const require = createRequire(import.meta.url);
const { createStore } = require('zustand/vanilla');

const check = (mutative, label) => {
  const store = createStore()(
    mutative(
      (set) => ({
        count: 0,
        tags: new Set(),
        increment: () =>
          set((state) => {
            state.count += 1;
            state.tags.add(state.count);
          }),
      }),
      { enableAutoFreeze: true }
    )
  );
  store.getState().increment();
  const state = store.getState();
  assert.equal(state.count, 1, label);
  assert.deepEqual([...state.tags], [1], label);
  assert.ok(Object.isFrozen(state.tags), label);
};

check((await import('zustand-mutative')).mutative, 'import');
check(require('zustand-mutative').mutative, 'require');

// Node.js emits warnings on the next tick.
await new Promise((resolve) => setImmediate(resolve));
assert.deepEqual(warnings, []);
console.log('zustand-mutative loads with import and require');
