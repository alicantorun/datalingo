// components/MonacoEditor.tsx
import React from "react";
import Editor, { OnChange } from "@monaco-editor/react";

export interface MonacoEditorProps {
  language: string;
  theme: string;
  height: string;
  code: string;
  onChange: (value: string, event: any) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  language,
  theme,
  code,
  onChange,
  height,
}) => {
  return (
    <Editor
      height={height}
      theme={theme}
      language={language}
      defaultValue={code}
      onChange={onChange as OnChange}
    />
  );
};

export default MonacoEditor;
