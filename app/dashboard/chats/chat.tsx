"use client";

import { v4 as uuidv4 } from "uuid";

import { forwardRef, useEffect, useRef, useState } from "react";
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
import { DndContext, useDroppable } from "@dnd-kit/core";

import { ChartComponent } from "./chart";
import { ChatPlaceholder } from "./chat-placeholder";
import { SortableTaskItem } from "./sortable-task-item";
import { useAtom } from "jotai";
import { DATA, chartAtom, boardSectionsAtom } from "./chartAtom";

type ChatProps = {
    id: string;
};

export const Chat = (props: ChatProps) => {
    const { setNodeRef } = useDroppable({
        id: props.id,
    });

    const [boardSections, setBoardSections] = useAtom(boardSectionsAtom);

    const [charts, setCharts] = useAtom(chartAtom);

    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [code, setCode] = useState("// write your code here");
    const [context, setContext] = useState("");

    const handleEditorChange = (value: string | undefined, event: any) => {
        if (value !== undefined) {
            setCode(value);
        }
    };

    const handleContextChange = (event: any) => {
        setContext(event.target.value);
    };

    const {
        messages,
        input,
        setInput,
        handleSubmit,
        isLoading,
        setMessages,
    }: any = useChat({
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
        // sendExtraMessageFields: true,

        onFinish: (message) => {
            setContext("");

            // if message.content === typeof string

            const newMessage = JSON.parse(message?.content);

            console.log("newMessage: ", newMessage);

            const newId = uuidv4();

            const getChartProperty = (newMessage: any) => {
                if (newMessage?.response?.result?.bar_chart) {
                    return {
                        chart: {
                            ...newMessage.response.result.bar_chart,
                            name: "get_bar_chart",
                        },
                    };
                } else if (newMessage?.response?.result?.pie_chart) {
                    return {
                        chart: {
                            ...newMessage.response.result.pie_chart,
                            name: "get_pie_chart",
                        },
                    };
                } else if (newMessage?.response?.result?.line_chart) {
                    return {
                        chart: {
                            ...newMessage.response.result.line_chart,
                            name: "get_line_chart",
                        },
                    };
                }
                return {}; // Return an empty object if none of the properties are found
            };

            const getChartObject = (newMessage: any, newId: string) => {
                if (newMessage?.response?.result?.bar_chart) {
                    return {
                        id: newId,
                        name: "get_bar_chart",
                        data: newMessage.response.result.bar_chart.chartdata,
                        section: "chat",
                    };
                } else if (newMessage?.response?.result?.pie_chart) {
                    return {
                        id: newId,
                        name: "get_pie_chart",
                        data: newMessage.response.result.pie_chart.chartdata,
                        section: "chat",
                    };
                } else if (newMessage?.response?.result?.line_chart) {
                    return {
                        id: newId,
                        name: "get_line_chart",
                        data: newMessage.response.result.line_chart.chartdata,
                        section: "chat",
                    };
                }
                return null; // Return null if no chart data is found
            };

            setMessages((prevMessages: any[]): any[] => {
                const filteredMessages = prevMessages.filter(
                    (msg) => msg.id !== message.id
                );

                if (typeof newMessage.response === "string") {
                    return [
                        ...filteredMessages,
                        {
                            ...message,
                            content: newMessage?.response,
                        },
                    ];
                } else if (typeof newMessage.response === "object") {
                    return [
                        ...filteredMessages,
                        {
                            ...message,
                            content: "No message content returned from API",
                            sql: newMessage?.response?.result?.sql_query,
                            ...getChartProperty(newMessage), // Add the dynamic chart property
                        },
                    ];
                }
            });

            if (typeof newMessage.response === "object") {
                const chartObj = getChartObject(newMessage, newId);
                if (chartObj) {
                    setCharts([...charts, chartObj]);
                }
            }

            // setCharts([...charts, { id: newId, ...DATA, section: "chat" }]);

            // setBoardSections((prevBoardSections) => {
            //     // Create a new item with a unique ID
            //     const newItem = { id: newId, ...DATA, section: "chat" };

            //     // Update the 'chat' section with the new item
            //     return {
            //         ...prevBoardSections,
            //         chat: [...prevBoardSections.chat, newItem],
            //     };
            // });
        },
    });

    const disabled = isLoading || input.length === 0;

    // console.log(charts);
    // console.log(messages);

    return (
        <div
            className="relative flex flex-col justify-start items-center  pb-40 h-full"
            ref={setNodeRef}
        >
            <div className="flex flex-col  w-full">
                <label>Context:</label>
                <div className="border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4 rounded-lg">
                    <textarea
                        className="w-full pr-10 outline-none border-none border-transparent focus:border-transparent focus:ring-0"
                        value={context}
                        onChange={handleContextChange}
                        placeholder="Enter text here..."
                    />
                </div>
            </div>
            {messages.length > 0 ? (
                messages.map((message: any, i: any) => {
                    return (
                        <div
                            key={i}
                            className={clsx(
                                "flex w-full items-center justify-center border-b border-gray-200 py-8",
                                message.role === "user"
                                    ? "bg-white"
                                    : "bg-gray-100"
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
                                        {(message as any) && message.content}
                                    </ReactMarkdown>

                                    {(message as any)?.sql && (
                                        <div className="mb-4">
                                            <h1 className="mt-4">Query:</h1>
                                            <MonacoEditor
                                                height="100px"
                                                language="sql"
                                                theme="dark"
                                                code={(message as any)?.sql}
                                                onChange={handleEditorChange}
                                            />
                                        </div>
                                    )}

                                    {typeof (message as any).chart ===
                                        "object" && (
                                        <SortableTaskItem
                                            id={(message as any)?.id}
                                        >
                                            <ChartComponent
                                                data={(message as any)?.chart}
                                            />
                                        </SortableTaskItem>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <ChatPlaceholder setInput={setInput} />
            )}
            <div className="absolute bottom-0 w-full flex flex-col items-center ">
                <form
                    ref={formRef}
                    onSubmit={(e) =>
                        handleSubmit(e, {
                            options: { body: { context } },
                        })
                    }
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
                                    input.length === 0
                                        ? "text-gray-300"
                                        : "text-white"
                                )}
                            />
                        )}
                    </button>
                </form>
                <span className="h-5" />
            </div>
        </div>
    );
};

Chat.displayName = "Chat"; // Assigning a display name
