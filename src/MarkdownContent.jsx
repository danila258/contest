import React, { useMemo } from "react";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import "katex/dist/katex.min.css";

const markdown = new MarkdownIt({ html: false, breaks: true }).use(texmath, {
  engine: katex,
  delimiters: "dollars",
  katexOptions: { trust: false, throwOnError: false },
});

export default function MarkdownContent({ source }) {
  const html = useMemo(() => markdown.render(source), [source]);
  return <div className="markdownContent" dangerouslySetInnerHTML={{ __html: html }} />;
}
