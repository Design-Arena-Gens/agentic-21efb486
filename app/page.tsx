"use client";
import React from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";

const MonacoEditor = dynamic(() => import("@/components/MonacoEditor"), { ssr: false });
import FileTree from "@/components/FileTree";
import { useIdeState } from "@/lib/state";
import GithubControls from "@/components/GithubControls";

export default function Page() {
  const { openFiles, activeFilePath, setActiveFilePath, status } = useIdeState();

  return (
    <>
      <div className="topbar">
        <strong>Agentic IDE</strong>
        <div className="spacer" />
        <GithubControls />
      </div>
      <div className="main">
        <aside className="sidebar">
          <div className="section">
            <input placeholder="Search files..." style={{ width: "100%" }} />
          </div>
          <div className="files">
            <FileTree />
          </div>
        </aside>
        <section className="editor">
          <div className="tabs">
            {openFiles.map((f) => (
              <div
                key={f.path}
                className={clsx("tab", activeFilePath === f.path && "active")}
                onClick={() => setActiveFilePath(f.path)}
              >
                {f.name}
              </div>
            ))}
          </div>
          <MonacoEditor />
        </section>
      </div>
      <div className="statusbar">
        <span>{status.message}</span>
      </div>
    </>
  );
}
