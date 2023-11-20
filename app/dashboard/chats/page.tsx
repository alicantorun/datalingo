"use client";

import React, { useEffect, useState } from "react";
import { ChartData } from "./chartAtom";

import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    useDroppable,
    useDraggable,
    closestCorners,
    DragStartEvent,
    DragOverEvent,
    DropAnimation,
    defaultDropAnimation,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { ChartComponent } from "./chart";
import { Chat } from "./chat";
import { SortableTaskItem } from "./sortable-task-item";

import { useAtom } from "jotai";
import {
    BoardSectionsChart,
    Section,
    boardSectionsAtom,
    chartAtom,
} from "./chartAtom";

export default function Page() {
    const [charts] = useAtom(chartAtom);
    const [boardSections, setBoardSections] = useAtom(boardSectionsAtom);
    const initialBoardSections = initializeBoard(charts);

    useEffect(() => {
        setBoardSections(initialBoardSections);
    }, []);

    const [activeChartId, setActiveChartId] = useState<null | string>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveChartId(active.id as string);
    };

    const handleDragOver = ({ active, over }: DragOverEvent) => {
        const activeContainer = findBoardSectionContainer(
            boardSections,
            active.id as string
        );
        const overContainer = findBoardSectionContainer(
            boardSections,
            over?.id as string
        );

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            return;
        }

        setBoardSections((boardSection) => {
            const activeItems = boardSection[activeContainer];
            const overItems = boardSection[overContainer];
            const activeIndex = activeItems.findIndex(
                (item) => item.id === active.id
            );
            const overIndex = overItems.findIndex(
                (item) => item.id === over?.id
            );

            let newActiveItems = [...activeItems];
            let newOverItems = [...overItems];

            // Create a new object with updated section property
            const itemWithNewSection = {
                ...newActiveItems[activeIndex],
                section: overContainer as Section,
            };

            newActiveItems.splice(activeIndex, 1);
            newOverItems.splice(overIndex, 0, itemWithNewSection);

            return {
                ...boardSection,
                [activeContainer]: newActiveItems,
                [overContainer]: newOverItems,
            };
        });
    };
    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        const activeContainer = findBoardSectionContainer(
            boardSections,
            active.id as string
        );
        const overContainer = findBoardSectionContainer(
            boardSections,
            over?.id as string
        );

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer !== overContainer
        ) {
            return;
        }

        const activeIndex = boardSections[activeContainer].findIndex(
            (chart) => chart.id === active.id
        );
        const overIndex = boardSections[overContainer].findIndex(
            (chart) => chart.id === over?.id
        );

        if (activeIndex !== overIndex) {
            setBoardSections((boardSection) => ({
                ...boardSection,
                [overContainer]: arrayMove(
                    boardSection[overContainer],
                    activeIndex,
                    overIndex
                ),
            }));
        }

        setActiveChartId(null);
    };

    const chart = activeChartId ? getChartById(charts, activeChartId) : null;

    console.log(boardSections);
    console.log(charts);

    return (
        <div className="h-full mx-auto p-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <h1 className="text-2xl">Dashboard</h1>
                <div className="grid grid-cols-3 gap-4 h-full">
                    {Object.keys(boardSections).map((boardSectionKey, i) => (
                        <div className="col-span-1" key={boardSectionKey}>
                            <BoardSection
                                isChat={i === 2}
                                id={boardSectionKey}
                                title={boardSectionKey}
                                charts={boardSections[boardSectionKey]}
                            />
                        </div>
                    ))}
                    <DragOverlay>
                        {chart ? (
                            <TaskItem data={chart} />
                        ) : (
                            <>No chart found</>
                        )}
                    </DragOverlay>
                </div>
            </DndContext>
        </div>
    );
}

type BoardSectionsType = {
    [name: string]: BoardSectionsChart[];
};

const initializeBoard = (charts: BoardSectionsChart[]) => {
    const boardSections: BoardSectionsType = {};

    Object.keys(BOARD_SECTIONS).forEach((boardSectionKey) => {
        boardSections[boardSectionKey] = getChartsBySection(
            charts,
            boardSectionKey as Section
        );
    });

    return boardSections;
};

const findBoardSectionContainer = (
    boardSections: BoardSectionsType,
    id: string
) => {
    if (id in boardSections) {
        return id;
    }

    const container = Object.keys(boardSections).find((key) =>
        boardSections[key].find((item) => item.id === id)
    );

    return container;
};

const BOARD_SECTIONS = {
    dashboard: "dashboard",
    demo: "demo",
    chat: "chat",
};

const getChartsBySection = (charts: BoardSectionsChart[], section: Section) => {
    return charts.filter((chart) => chart.section === section);
};

const getChartById = (charts: BoardSectionsChart[], id: string) => {
    return charts.find((chart) => chart.id === id);
};

const BoardSection = ({
    id,
    title,
    charts,
    isChat,
}: {
    id: string;
    title: string;
    charts: BoardSectionsChart[];
    isChat: boolean;
}) => {
    const { setNodeRef } = useDroppable({
        id,
    });

    if (isChat) return <Chat id={id} />;

    return (
        <div className="p-2">
            {/* <h6 className="text-lg font-semibold mb-2">{title}</h6> */}
            <SortableContext
                id={id}
                items={charts}
                strategy={verticalListSortingStrategy}
            >
                <div ref={setNodeRef}>
                    {charts.map((chart) => {
                        console.log("chart: ", chart);

                        return (
                            <div key={chart.id} className="mb-2">
                                <SortableTaskItem id={chart.id}>
                                    <TaskItem data={chart} />
                                </SortableTaskItem>
                            </div>
                        );
                    })}
                </div>
            </SortableContext>
        </div>
    );
};

const TaskItem = ({ data }: { data: ChartData }) => {
    return <ChartComponent data={data} />;
};
