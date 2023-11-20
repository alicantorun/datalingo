import { atom } from "jotai";

export const DATA = {};

const INITIAL_CHARTS: any[] = [];

export type Section = "chat" | "dashboard" | "demo";

export type BoardSectionsChart = ChartData & { section: Section };

export type ChartData = {
    name: string;
    id: string;
    chartdata: Array<{ [key: string]: any }>;
    categories?: string[];
    category?: string;
};

export type BoardSectionsType = {
    [name: string]: BoardSectionsChart[];
};

const initialBoardSections: BoardSectionsType = {};

export const chartAtom = atom(INITIAL_CHARTS);

export const boardSectionsAtom = atom(initialBoardSections);
