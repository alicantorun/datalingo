import React, { useRef } from "react";

interface ChatPlaceholderProps {
  setInput: (input: string) => void; // Assuming setInput is a function that sets some input state
}

export const examples = [
  "How many customers with active status are currently listed in our database?",
  "What is the total amount of all pending invoices recorded in our database?",
  "Which customer in our database has an invoice with a pending status?",
];

export const ChatPlaceholder: React.FC<ChatPlaceholderProps> = ({
  setInput,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-gray-200 sm:mx-0 mx-5 mt-20 max-w-screen-md rounded-md border sm:w-full">
      <div className="flex flex-col space-y-4 p-7 sm:p-10">
        <h1 className="text-lg font-semibold text-black">
          Welcome to your personal Wyzard.ai AI Data Assistant Chatbot!
        </h1>
        <p className="text-gray-500">
          Feel free to ask questions and explore insights...
          <br />
          You can begin by typing your query below or consider using one of
          these examples to get started: with natural language.
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
  );
};
