import React, { useEffect, useRef } from "react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

export default function CodeEditor({ initialValue, onChange, filename = "main.cpp" }) {
  const host = useRef(null);
  const initial = useRef(initialValue);
  const save = useRef(onChange);
  save.current = onChange;

  useEffect(() => {
    const instance = editor.create(host.current, {
      value: initial.current,
      language: "cpp",
      ariaLabel: `Редактор C++, ${filename}`,
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      tabSize: 4,
      scrollBeyondLastLine: false,
      lineNumbersMinChars: 3,
    });
    const listener = instance.onDidChangeModelContent(() => save.current(instance.getValue()));
    return () => {
      listener.dispose();
      instance.dispose();
    };
  }, [filename]);

  return <div className="code-editor" ref={host} />;
}
