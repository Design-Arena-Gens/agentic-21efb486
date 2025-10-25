"use client";
import React, { useEffect, useMemo, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useIdeState } from "@/lib/state";

export default function MonacoEditor() {
  const { activeFilePath, fileMap, updateFileContent } = useIdeState();
  const active = activeFilePath ? fileMap[activeFilePath] : undefined;
  const language = useMemo(() => detectLanguage(active?.name || ""), [active?.name]);
  const valueRef = useRef<string>(active?.content || "");

  useEffect(() => {
    valueRef.current = active?.content || "";
  }, [active?.content]);

  const handleChange = (value?: string) => {
    if (!active) return;
    const next = value ?? "";
    valueRef.current = next;
    updateFileContent(active.path, next);
  };

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // no-op, content is already persisted
    });
  };

  if (!active) {
    return <div style={{ padding: 16 }}>Open a file to start editing.</div>;
  }

  return (
    <Editor
      height="calc(100vh - 48px - 26px - 40px)"
      theme="vs-dark"
      path={active.path}
      language={language}
      value={active.content}
      onChange={handleChange}
      onMount={onMount}
      options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on" }}
    />
  );
}

function detectLanguage(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "javascript";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  return undefined;
}
