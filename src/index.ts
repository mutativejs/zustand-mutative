import { create } from 'mutative';
import type { Draft } from 'mutative';
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Mutative = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [...Mps, ['zustand/mutative', never]], Mcs>
) => StateCreator<T, Mps, [['zustand/mutative', never], ...Mcs]>;

type Write<T, U> = Omit<T, keyof U> & U;
type SkipTwo<T> = T extends { length: 0 }
  ? []
  : T extends { length: 1 }
  ? []
  : T extends { length: 0 | 1 }
  ? []
  : T extends [unknown, unknown, ...infer A]
  ? A
  : T extends [unknown, unknown?, ...infer A]
  ? A
  : T extends [unknown?, unknown?, ...infer A]
  ? A
  : never;

declare module 'zustand/vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    ['zustand/mutative']: WithMutative<S>;
  }
}

type WithMutative<S> = Write<S, StoreMutative<S>>;

type StoreMutative<S> = S extends {
  getState: () => infer T;
  setState: infer SetState;
}
  ? SetState extends (...a: infer A) => infer Sr
    ? {
        setState(
          nextStateOrUpdater: T | Partial<T> | ((state: Draft<T>) => void),
          shouldReplace?: boolean | undefined,
          ...a: SkipTwo<A>
        ): Sr;
      }
    : never
  : never;

type MutativeImpl = <T>(
  storeInitializer: StateCreator<T, [], []>
) => StateCreator<T, [], []>;

const mutativeImpl: MutativeImpl = (initializer) => (set, get, store) => {
  type T = ReturnType<typeof initializer>;

  store.setState = (updater, replace, ...a) => {
    const nextState = (
      typeof updater === 'function' ? create(updater as any) : updater
    ) as ((s: T) => T) | T | Partial<T>;

    return set(nextState as any, replace, ...a);
  };

  return initializer(store.setState, get, store);
};

export const mutative = mutativeImpl as unknown as Mutative;
