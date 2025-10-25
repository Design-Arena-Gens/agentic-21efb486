"use client";
import React, { useEffect } from "react";
import { useIdeState } from "@/lib/state";

export default function FileTree() {
  const { files, openFile, activeFilePath } = useIdeState();

  useEffect(() => {
    // Load default sample project on first mount
    // Only if no files yet
    // The state hook handles seeding
  }, []);

  return (
    <div>
      {files.map((f) => (
        <div
          key={f.path}
          className={`file ${activeFilePath === f.path ? "active" : ""}`}
          onClick={() => openFile(f.path)}
          title={f.path}
        >
          <span className="name">{f.name}</span>
        </div>
      ))}
    </div>
  );
}
