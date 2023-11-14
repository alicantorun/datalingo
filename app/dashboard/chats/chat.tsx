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
    // Define any other props here
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

            const newMessage = JSON.parse(message?.content);

            const newId = uuidv4();

            handleSetMessages({
                ...message,
                content: newMessage?.response,
                sql: newMessage?.sql,
                function_call: {
                    id: newId,
                    name: newMessage?.function_call?.name,
                    data: JSON.parse(newMessage?.function_call?.arguments),
                },
            });

            if (newMessage?.function_call?.name) {
                setCharts([...charts, { id: newId, ...DATA, section: "chat" }]);

                setBoardSections((prevBoardSections) => {
                    // Create a new item with a unique ID
                    const newItem = { id: newId, ...DATA, section: "chat" };

                    // Update the 'chat' section with the new item
                    return {
                        ...prevBoardSections,
                        chat: [...prevBoardSections.chat, newItem],
                    };
                });
            }
        },
    });

    const handleSetMessages = (content: any): void => {
        setMessages((prevMessages: any[]): any[] => {
            const filteredMessages = prevMessages.filter(
                (msg) => msg.id !== content.id
            );

            return [...filteredMessages, content];
        });
    };

    const disabled = isLoading || input.length === 0;

    return (
        <div
            className="flex flex-col items-center justify-between pb-40"
            ref={setNodeRef}
        >
            <div className="flex flex-col h-full w-full">
                <label>Context:</label>
                <div className="border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4">
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
                    // console.log((message as any)?.function_call.name);

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
                                        <SortableTaskItem
                                            id={
                                                (message as any)?.function_call
                                                    .id
                                            }
                                        >
                                            <ChartComponent
                                                data={
                                                    (message as any)
                                                        ?.function_call
                                                }
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
            <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3  p-5 pb-3 sm:px-0">
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
