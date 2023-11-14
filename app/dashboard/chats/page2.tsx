"use client";

import React, { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

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

import { Message, useChat } from "ai/react";
import va from "@vercel/analytics";
import clsx from "clsx";
import { LoadingCircle, SendIcon } from "@/app/ui/icons";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Textarea from "react-textarea-autosize";
import { toast } from "sonner";
import MonacoEditor from "@/app/ui/monaco-editor/editor";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChartComponent } from "./chart";
import { ChatPlaceholder } from "./chat-placeholder";

import Droppable from "./droppable";
import Draggable from "./draggable";

export default function Chat() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    messages = [],
    input,
    setInput,
    handleSubmit,
    isLoading,
    setMessages,
  }: {
    setMessages: any;
    messages: any;
    input: any;
    setInput: any;
    handleSubmit: any;
    isLoading: any;
  } = useChat({
    onResponse: (response) => {
      if (response.status === 429) {
        toast.error("You have reached your request limit for the day.");
        va.track("Rate limited");
        return;
      } else {
        va.track("Chat initiated");
      }
    },
    onError: (error) => {
      va.track("Chat errored", {
        input,
        error: error.message,
      });
    },
    onFinish: (message) => {
      const newMessage = JSON.parse(message.content);

      handleSetMessages({
        ...message,
        content: newMessage?.response,
        sql: newMessage?.sql,
        function_call: {
          name: newMessage?.function_call?.name,
          data: JSON.parse(newMessage?.function_call?.arguments),
        },
      });
    },
  });
  const [code, setCode] = useState("// write your code here");

  const handleSetMessages = (content: any): void => {
    setMessages((prevMessages: any[]): any[] => {
      const filteredMessages = prevMessages.filter(
        (msg) => msg.id !== content.id
      );

      return [...filteredMessages, content];
    });
  };

  const handleEditorChange = (value: string | undefined, event: any) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const tasks = INITIAL_TASKS;
  const initialBoardSections = initializeBoard(INITIAL_TASKS);
  const [boardSections, setBoardSections] =
    useState<BoardSectionsType>(initialBoardSections);

  const [activeTaskId, setActiveTaskId] = useState<null | string>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTaskId(active.id as string);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    // Find the containers
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

      // Find the indexes for the items
      const activeIndex = activeItems.findIndex(
        (item) => item.id === active.id
      );
      const overIndex = overItems.findIndex((item) => item.id !== over?.id);

      return {
        ...boardSection,
        [activeContainer]: [
          ...boardSection[activeContainer].filter(
            (item) => item.id !== active.id
          ),
        ],
        [overContainer]: [
          ...boardSection[overContainer].slice(0, overIndex),
          boardSections[activeContainer][activeIndex],
          ...boardSection[overContainer].slice(
            overIndex,
            boardSection[overContainer].length
          ),
        ],
      };
    });
  };

  // const handleDragEnd = ({ active, over }: DragEndEvent) => {
  //   const activeContainer = findBoardSectionContainer(
  //     boardSections,
  //     active.id as string
  //   );
  //   const overContainer = findBoardSectionContainer(
  //     boardSections,
  //     over?.id as string
  //   );

  //   if (
  //     !activeContainer ||
  //     !overContainer ||
  //     activeContainer !== overContainer
  //   ) {
  //     return;
  //   }

  //   const activeIndex = boardSections[activeContainer].findIndex(
  //     (task) => task.id === active.id
  //   );
  //   const overIndex = boardSections[overContainer].findIndex(
  //     (task) => task.id === over?.id
  //   );

  //   if (activeIndex !== overIndex) {
  //     setBoardSections((boardSection) => ({
  //       ...boardSection,
  //       [overContainer]: arrayMove(
  //         boardSection[overContainer],
  //         activeIndex,
  //         overIndex
  //       ),
  //     }));
  //   }

  //   setActiveTaskId(null);
  // };

  const task = activeTaskId ? getTaskById(tasks, activeTaskId) : null;
  const disabled = isLoading || input.length === 0;

  const containers = ["A", "B", "C"];
  const [parent, setParent] = useState(null);
  const draggableMarkup = <Draggable id="draggable">Drag me</Draggable>;

  function handleDragEnd(event: any) {
    const { over } = event;

    // If the item is dropped over a container, set it as the parent
    // otherwise reset the parent to `null`
    setParent(over ? over.id : null);
  }

  return (
    //   <DndContext onDragEnd={handleDragEnd}>
    //   {parent === null ? draggableMarkup : null}

    //   {containers.map((id) => (

    //     <Droppable key={id} id={id}>
    //       {parent === id ? draggableMarkup : 'Drop here'}
    //     </Droppable>
    //   ))}
    // </DndContext>

    <div className="container mx-auto p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        // onDragStart={handleDragStart}
        // onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {parent === null ? draggableMarkup : null}
        <div className="flex bg-slate-300">
          <div className="md:w-1/2 w-full h-full">
            <Droppable id="droppable">
              {/* {isDropped ? draggableMarkup : "Drop here"} */}
              {parent === "droppable" ? draggableMarkup : "Drop here"}
            </Droppable>
          </div>
          <div className="w-1/2">
            <main className="flex flex-col items-center justify-between pb-40">
              {messages.length > 0 ? (
                messages.map((message: any, i: any) => {
                  console.log((message as any)?.function_call);

                  return (
                    <div
                      key={i}
                      className={clsx(
                        "flex w-full items-center justify-center border-b border-gray-200 py-8",
                        message.role === "user" ? "bg-white" : "bg-gray-100"
                      )}
                    >
                      <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
                        <div
                          className={clsx(
                            "p-1.5 text-white",
                            message.role === "assistant"
                              ? "bg-green-500"
                              : "bg-black"
                          )}
                        >
                          {message.role === "user" ? (
                            <User width={20} />
                          ) : (
                            <Bot width={20} />
                          )}
                        </div>
                        <div className="flex flex-col w-full">
                          <ReactMarkdown
                            className="prose mt-1 w-full break-words prose-p:leading-relaxed"
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // open links in new tab
                              a: (props) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              ),
                            }}
                          >
                            {!(message as any)?.function_call &&
                              message.content}
                          </ReactMarkdown>
                          {(message as any)?.sql && (
                            <>
                              <h1 className="mt-4">Query:</h1>
                              <MonacoEditor
                                height="100px"
                                language="sql"
                                theme="dark"
                                code={(message as any)?.sql}
                                onChange={handleEditorChange}
                              />
                            </>
                          )}
                          {(message as any)?.function_call && (
                            <Draggable id={"draggable"}>
                              <ChartComponent
                                data={(message as any)?.function_call}
                              />
                            </Draggable>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <ChatPlaceholder setInput={setInput} />
                  {/* {!isDropped ? draggableMarkup : null} */}
                </>
              )}
              <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3  p-5 pb-3 sm:px-0">
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="relative w-full max-w-screen-md rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4"
                >
                  <Textarea
                    ref={inputRef}
                    tabIndex={0}
                    required
                    rows={1}
                    autoFocus
                    placeholder="Send a message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        formRef.current?.requestSubmit();
                        e.preventDefault();
                      }
                    }}
                    spellCheck={false}
                    className="w-full pr-10 outline-none border-none border-transparent focus:border-transparent focus:ring-0"
                  />
                  <button
                    className={clsx(
                      "absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all",
                      disabled
                        ? "cursor-not-allowed bg-white"
                        : "bg-green-500 hover:bg-green-600"
                    )}
                    disabled={disabled}
                  >
                    {isLoading ? (
                      <LoadingCircle />
                    ) : (
                      <SendIcon
                        className={clsx(
                          "h-4 w-4",
                          input.length === 0 ? "text-gray-300" : "text-white"
                        )}
                      />
                    )}
                  </button>
                </form>
                <span className="h-5" />
              </div>
            </main>
          </div>

          {/* {Object.keys(boardSections).map((boardSectionKey) => (
            <div className="w-1/2 bg-red-200" key={boardSectionKey}>
              <BoardSection
                id={boardSectionKey}
                title={boardSectionKey}
                tasks={boardSections[boardSectionKey]}
              />
            </div>
          ))} */}
          <DragOverlay>{task ? <TaskItem task={task} /> : null}</DragOverlay>
        </div>
      </DndContext>
    </div>
  );
}

// type DraggableProps = {
//   children: React.ReactNode;
//   id: string;
// };

// const Draggable = ({ children, id }: DraggableProps) => {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0 : 1,
//   };

//   return (
//     <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
//       {children}
//     </div>
//   );
// };

export const INITIAL_TASKS: Task[] = [
  {
    id: uuidv4(),
    title: "Title 2",
    description: "Desc 2",
    status: "backlog",
  },
  {
    id: uuidv4(),
    title: "Title 3",
    description: "Desc 3",
    status: "backlog",
  },
  {
    id: uuidv4(),
    title: "Title 4",
    description: "Desc 4",
    status: "done",
  },
];

export type Status = "backlog" | "in progress" | "done";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
};

export type BoardSectionsType = {
  [name: string]: Task[];
};

export const initializeBoard = (tasks: Task[]) => {
  const boardSections: BoardSectionsType = {};

  Object.keys(BOARD_SECTIONS).forEach((boardSectionKey) => {
    boardSections[boardSectionKey] = getTasksByStatus(
      tasks,
      boardSectionKey as Status
    );
  });

  return boardSections;
};

export const findBoardSectionContainer = (
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

export const BOARD_SECTIONS = {
  backlog: "backlog",
  done: "done",
};

export const getTasksByStatus = (tasks: Task[], status: Status) => {
  return tasks.filter((task) => task.status === status);
};

export const getTaskById = (tasks: Task[], id: string) => {
  return tasks.find((task) => task.id === id);
};

type BoardSectionProps = {
  id: string;
  title: string;
  tasks: Task[];
};

export const BoardSection = ({ id, title, tasks }: BoardSectionProps) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="bg-gray-200 p-2">
      <h6 className="text-lg font-semibold mb-2">{title}</h6>
      <SortableContext
        id={id}
        items={tasks}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef}>
          {tasks.map((task) => (
            <div key={task.id} className="mb-2">
              <Draggable id={task.id}>
                {/* TaskItem component - Ensure it is styled with Tailwind CSS */}
                <TaskItem task={task} />
              </Draggable>
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

type TaskItemProps = {
  task: Task;
};

const TaskItem = ({ task }: TaskItemProps) => {
  return (
    <div className="shadow-md border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4">{task.title}</div>
    </div>
  );
};
