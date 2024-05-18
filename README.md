# zustand-mutative
A Mutative middleware for Zustand enhances the efficiency of immutable state updates.

## Installation
```bash
npm install zustand-mutative
```

## Usage
```typescript
import { create } from 'zustand'
import { mutative } from 'zustand-mutative'

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

export const useCountStore = create<State & Actions>()(
  mutative((set) => ({
    count: 0,
    increment: (qty: number) =>
      set((state) => {
        state.count += qty
      }),
    decrement: (qty: number) =>
      set((state) => {
        state.count -= qty
      }),
  })),
)
```
