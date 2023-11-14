// chartAtom.js
import { atom } from "jotai";
import { v4 as uuidv4 } from "uuid";

export const DATA = {
  name: "get_bar_chart",
  data: {
    data: [
      {
        name: "New York",
        value: 9800,
      },
      {
        name: "London",
        value: 4567,
      },
      {
        name: "Hong Kong",
        value: 3908,
      },
      {
        name: "San Francisco",
        value: 2400,
      },
      {
        name: "Singapore",
        value: 1908,
      },
      {
        name: "Zurich",
        value: 1398,
      },
    ],
  },
};

const INITIAL_CHARTS = [
  {
    id: uuidv4(),
    ...DATA,
    section: "dashboard",
  },
  {
    id: uuidv4(),
    ...DATA,
    section: "dashboard",
  },
  {
    id: uuidv4(),
    ...DATA,
    section: "demo",
  },

  // ... other charts
];

export type Chart = {
  id: string;
  name: string;
  data: any;
  section?: string;
};

export type BoardSectionsType = {
  [name: string]: Chart[];
};

const initialBoardSections: BoardSectionsType = {
  // Initial state
};

export const chartAtom = atom(INITIAL_CHARTS);

export const boardSectionsAtom = atom(initialBoardSections);
