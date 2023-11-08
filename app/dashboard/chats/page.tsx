"use client";

import { useEffect, useRef, useState } from "react";
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

const examples = [
  "How many customers with active status are currently listed in our database?",
  "What is the total amount of all pending invoices recorded in our database?",
  "Which customer in our database has an invoice with a pending status?",
];

export default function Chat() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [code, setCode] = useState("// write your code here");

  const handleEditorChange = (value: string | undefined, event: any) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const { messages, input, setInput, handleSubmit, isLoading, setMessages } =
    useChat({
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
        });
      },
    });

  const handleSetMessages = (content: any) => {
    setMessages((prevMessages: any) => {
      const filteredMessages = prevMessages.filter(
        (msg) => msg.id !== content.id
      );

      return [...filteredMessages, content];
    });
  };

  const disabled = isLoading || input.length === 0;

  console.log(messages);

  return (
    <main>
      <div className="flex flex-col md:flex-row md:flex-wrap">
        <div className="w-full">
          <main className="flex flex-col items-center justify-between pb-40">
            {messages.length > 0 ? (
              messages.map((message, i) => {
                console.log((message as any)?.sql);

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
                          {message.content}
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
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="border-gray-200sm:mx-0 mx-5 mt-20 max-w-screen-md rounded-md border sm:w-full">
                <div className="flex flex-col space-y-4 p-7 sm:p-10">
                  <h1 className="text-lg font-semibold text-black">
                    Welcome to your personal Wyzard.ai AI Data Assistant
                    Chatbot!
                  </h1>
                  <p className="text-gray-500">
                    Feel free to ask questions and explore insights...
                    <br />
                    You can begin by typing your query below or consider using
                    one of these examples to get started: with natural language.
                  </p>
                </div>
                <div className="flex flex-col space-y-4 border-t border-gray-200 bg-gray-50 p-7 sm:p-10">
                  {examples.map((example, i) => (
                    <button
                      key={i}
                      className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
                      onClick={() => {
                        setInput(example);
                        inputRef.current?.focus();
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
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
        {/* <div className="md:w-1/2 w-full">
          <MonacoEditor
            language="sql"
            theme="dark"
            code={code}
            onChange={handleEditorChange}
          />
        </div> */}
        <div className="w-full">{/*  Footer if necessary */}</div>
      </div>
    </main>
  );
}
