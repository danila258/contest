import React, { useEffect } from "react";
import {
  configure,
  MarkdownEditorView,
  useMarkdownEditor,
} from "@gravity-ui/markdown-editor";
import MarkdownContent from "./MarkdownContent";

configure({ lang: "ru" });

export default function MarkdownField({ label, value, onChange, placeholder = "Начните писать здесь…" }) {
  const editor = useMarkdownEditor({
    preset: "commonmark",
    initial: { markup: value, mode: "markup" },
    md: { html: false, breaks: true },
    markupConfig: {
      placeholder,
      renderPreview: ({ getValue }) => <MarkdownContent source={getValue()} />,
    },
  });
  useEffect(() => {
    const change = () => onChange(editor.getValue());
    editor.on("change", change);
    return () => editor.off("change", change);
  }, [editor, onChange]);
  return (
    <fieldset className="markdownField">
      <legend>{label}</legend>
      <MarkdownEditorView editor={editor} stickyToolbar={false} settingsVisible={false} />
    </fieldset>
  );
}
