import fs from 'fs';
import https from 'https';
import { Suite } from 'benchmark';
import QuickChart from 'quickchart-js';
import { create as createWithZustand } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { setAutoFreeze } from 'immer';
import { mutative } from '../src';

const labels: string[] = [];
const result = [
  {
    label: 'Zustand with Mutative',
    backgroundColor: 'rgba(255, 0, 217, 0.5)',
    data: [],
  },
  {
    label: 'Zustand with Immer',
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    data: [],
  },
];

interface Data {
  arr: Record<string, number>[];
  map: Record<string, Record<string, number>>;
}

type Store = Data & {
  update: () => void;
};

const deepFreeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

// With auto-freeze, the base state is frozen in advance, so the first freeze
// of the whole state is not timed.
const getData = (freeze: boolean) => {
  const baseState: Data = {
    arr: [],
    map: {},
  };

  const createTestObject = () =>
    Array(10 * 5)
      .fill(1)
      .reduce((i, _, k) => Object.assign(i, { [k]: k }), {});

  baseState.arr = Array(10 ** 4 * 5)
    .fill('')
    .map(() => createTestObject());

  Array(10 ** 3)
    .fill(1)
    .forEach((_, i) => {
      baseState.map[i] = { i };
    });
  return freeze ? deepFreeze(baseState) : baseState;
};

let baseState: any;
let i: any;
let store: any;

const createMutativeStore = (enableAutoFreeze: boolean) => () => {
  i = Math.random();
  baseState = getData(enableAutoFreeze);
  store = createWithZustand(
    mutative<Store>(
      (set) => ({
        arr: baseState.arr,
        map: baseState.map,
        update: () => {
          set((state) => {
            state.arr.push(i);
            state.map[i] = { i };
          });
        },
      }),
      { enableAutoFreeze }
    )
  );
};

// Immer freezes by default and Mutative does not, so each comparison sets
// both to the same auto-freeze setting.
const createImmerStore = (autoFreeze: boolean) => () => {
  setAutoFreeze(autoFreeze);
  i = Math.random();
  baseState = getData(autoFreeze);
  store = createWithZustand(
    immer<Store>((set) => ({
      arr: baseState.arr,
      map: baseState.map,
      update: () => {
        set((state) => {
          state.arr.push(i);
          state.map[i] = { i };
        });
      },
    }))
  );
};

const update = () => {
  store.getState().update();
};

const suite = new Suite();

suite
  .add('Zustand with Mutative - Auto-freeze off', update, {
    onStart: createMutativeStore(false),
  })
  .add('Zustand with Immer - Auto-freeze off', update, {
    onStart: createImmerStore(false),
  })
  .add('Zustand with Mutative - Auto-freeze on', update, {
    onStart: createMutativeStore(true),
  })
  .add('Zustand with Immer - Auto-freeze on', update, {
    onStart: createImmerStore(true),
  })
  .on('cycle', (event: any) => {
    console.log(String(event.target));
    const [name, field = 'Update'] = event.target.name.split(' - ');
    if (!labels.includes(field)) labels.push(field);
    const item = result.find(({ label }) => label === name);
    // @ts-ignore
    item.data[labels.indexOf(field)] = Math.round(event.target.hz);
  })
  .on('complete', function (this: any) {
    labels.forEach((field) => {
      const fastest = this.filter((bench: any) =>
        bench.name.endsWith(` - ${field}`)
      )
        .filter('fastest')
        .map('name');
      console.log(`The fastest method with ${field} is ${fastest}`);
    });
  })
  .run({ async: false });

try {
  const config = {
    type: 'horizontalBar',
    data: {
      labels,
      datasets: result,
    },
    options: {
      title: {
        display: true,
        text: 'Zustand with Mutative vs Zustand with Immer - Performance',
      },
      legend: {
        position: 'bottom',
      },
      elements: {
        rectangle: {
          borderWidth: 1,
        },
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              fontSize: 10,
              labelString:
                'Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better.',
            },
          },
        ],
      },
      plugins: {
        datalabels: {
          anchor: 'center',
          align: 'center',
          font: {
            size: 8,
          },
        },
      },
    },
  };
  const chart = new QuickChart();
  chart.setConfig(config);
  const file = fs.createWriteStream('benchmark.jpg');
  https.get(chart.getUrl(), (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('update benchmark');
    });
  });
} catch (err) {
  console.error(err);
}
