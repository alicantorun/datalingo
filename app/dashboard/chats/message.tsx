import React from "react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MonacoEditor from "@monaco-editor/react"; // Assuming this is the correct import for your MonacoEditor
import Draggable from "./draggable"; // Replace with your actual import path
import { ChartComponent } from "./chart"; // Replace with your actual import path
import { Bot, User } from "lucide-react";

// Define the props for the message component
interface MessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
    sql?: string;
    function_call?: any; // Define the type based on what you expect
  };
  handleEditorChange?: (value: string | undefined, event: any) => void; // Define this prop if you need to handle changes in the SQL editor
}

export const MessageComponent: React.FC<MessageProps> = ({
  message,
  handleEditorChange,
}) => {
  return (
    <div
      className={clsx(
        "flex w-full items-center justify-center border-b border-gray-200 py-8",
        message.role === "user" ? "bg-white" : "bg-gray-100"
      )}
    >
      <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
        <div
          className={clsx(
            "p-1.5 text-white",
            message.role === "assistant" ? "bg-green-500" : "bg-black"
          )}
        >
          {/* Replace User and Bot components with your actual components */}
          {message.role === "user" ? <User width={20} /> : <Bot width={20} />}
        </div>
        <div className="flex flex-col w-full">
          <ReactMarkdown
            className="prose mt-1 w-full break-words prose-p:leading-relaxed"
            remarkPlugins={[remarkGfm]}
            components={{
              a: (props) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.sql && (
            <>
              <h1 className="mt-4">Query:</h1>
              <MonacoEditor
                height="100px"
                language="sql"
                theme="dark"
                value={message.sql}
                onChange={handleEditorChange}
              />
            </>
          )}
          {message.function_call && (
            <ChartComponent data={message.function_call} />
          )}
        </div>
      </div>
    </div>
  );
};
