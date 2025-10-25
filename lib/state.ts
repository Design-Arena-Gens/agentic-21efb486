"use client";
import React from "react";

export type IdeFile = { path: string; name: string; content: string };
export type Status = { level: "info" | "ok" | "warn" | "error"; message: string };
export type RepoRef = { owner: string; repo: string; branch: string } | null;

export function useIdeState() {
  const [files, setFiles] = React.useState<IdeFile[]>(() => seedFiles());
  const [openFiles, setOpenFiles] = React.useState<IdeFile[]>(() => (files.length ? [files[0]] : []));
  const [activeFilePath, setActiveFilePath] = React.useState<string | null>(openFiles[0]?.path ?? null);
  const [fileMap, setFileMap] = React.useState<Record<string, IdeFile>>(() => {
    const map: Record<string, IdeFile> = {};
    for (const f of files) map[f.path] = f;
    return map;
  });
  const [status, setStatus] = React.useState<Status>({ level: "info", message: "Ready." });
  const [headCommitSha, setHeadCommitSha] = React.useState<string | null>(null);
  const [baseTreeSha, setBaseTreeSha] = React.useState<string | null>(null);
  const [repoRef, setRepoRef] = React.useState<RepoRef>(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("ide_files_v1");
      if (saved) {
        const parsed: IdeFile[] = JSON.parse(saved);
        setFiles(parsed);
        const map: Record<string, IdeFile> = {};
        for (const f of parsed) map[f.path] = f;
        setFileMap(map);
        if (parsed.length) {
          setOpenFiles([parsed[0]]);
          setActiveFilePath(parsed[0].path);
        }
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    localStorage.setItem("ide_files_v1", JSON.stringify(files));
  }, [files]);

  const openFile = (path: string) => {
    const f = fileMap[path];
    if (!f) return;
    setOpenFiles((prev) => {
      if (prev.find((p) => p.path === path)) return prev;
      return [...prev, f];
    });
    setActiveFilePath(path);
  };

  const updateFileContent = (path: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content } : f)));
    setFileMap((prev) => ({ ...prev, [path]: { ...(prev[path] || { path, name: path.split("/").pop() || path }), content } }));
  };

  const setFilesFromGitHub = (
    incoming: IdeFile[],
    headSha: string,
    ref: NonNullable<RepoRef>,
    baseTree?: string
  ) => {
    setFiles(incoming);
    const map: Record<string, IdeFile> = {};
    for (const f of incoming) map[f.path] = f;
    setFileMap(map);
    setOpenFiles(incoming.length ? [incoming[0]] : []);
    setActiveFilePath(incoming[0]?.path ?? null);
    setHeadCommitSha(headSha);
    if (baseTree) setBaseTreeSha(baseTree);
    setRepoRef(ref);
  };

  return {
    files,
    openFiles,
    activeFilePath,
    fileMap,
    status,
    headCommitSha,
    baseTreeSha,
    repoRef,
    setActiveFilePath,
    openFile,
    updateFileContent,
    setStatus,
    setFilesFromGitHub,
  } as const;
}

function seedFiles(): IdeFile[] {
  return [
    { path: "README.md", name: "README.md", content: "# Agentic IDE\n\nWelcome. Pull a GitHub repo to start." },
    { path: "src/index.ts", name: "index.ts", content: "export function hello(name: string) {\n  return `Hello, ${name}!`;\n}\n" },
  ];
}
