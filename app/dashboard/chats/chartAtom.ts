// chartAtom.js
import { atom } from "jotai";
import { v4 as uuidv4 } from "uuid";

export const DATA = {
    name: "get_bar_chart",
    data: {
        data: [
            {
                month: "April",
                Germany: 300, // Number of orders shipped to Germany in April
                Italy: 250, // Number of orders shipped to Italy in April
            },
            {
                month: "May",
                Germany: 350, // Number of orders shipped to Germany in May
                Italy: 300, // Number of orders shipped to Italy in May
            },
            {
                month: "June",
                Germany: 400, // Number of orders shipped to Germany in June
                Italy: 350, // Number of orders shipped to Italy in June
            },
            {
                month: "July",
                Germany: 450, // Number of orders shipped to Germany in July
                Italy: 400, // Number of orders shipped to Italy in July
            },
            {
                month: "August",
                Germany: 500, // Number of orders shipped to Germany in August
                Italy: 450, // Number of orders shipped to Italy in August
            },
            {
                month: "September",
                Germany: 550, // Number of orders shipped to Germany in September
                Italy: 500, // Number of orders shipped to Italy in September
            },
        ],
    },
};

const INITIAL_CHARTS: any[] = [
    {
        id: uuidv4(),
        ...DATA,
        section: "dashboard",
    },
    // {
    //   id: uuidv4(),
    //   ...DATA,
    //   section: "dashboard",
    // },
    // {
    //   id: uuidv4(),
    //   ...DATA,
    //   section: "demo",
    // },
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
