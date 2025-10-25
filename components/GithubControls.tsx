"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useIdeState } from "@/lib/state";

export default function GithubControls() {
  const { status, setStatus, setFilesFromGitHub, files, repoRef, headCommitSha, baseTreeSha } = useIdeState();
  const [token, setToken] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");

  useEffect(() => {
    const cached = localStorage.getItem("gh_token");
    if (cached) setToken(cached);
  }, []);

  const disabled = !token || !owner || !repo;

  const doPull = async () => {
    setStatus({ level: "info", message: "Pulling from GitHub..." });
    try {
      const res = await fetch("/api/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, owner, repo, branch })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFilesFromGitHub(data.files, data.headCommitSha, { owner, repo, branch }, data.baseTreeSha);
      localStorage.setItem("gh_token", token);
      setStatus({ level: "ok", message: "Pulled latest content." });
    } catch (e: any) {
      setStatus({ level: "error", message: e.message || "Pull failed" });
    }
  };

  const doPush = async () => {
    setStatus({ level: "info", message: "Pushing to GitHub..." });
    try {
      if (!repoRef || !headCommitSha || !baseTreeSha) throw new Error("Pull first to get HEAD");
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, files, repoRef, headCommitSha, baseTreeSha, message: "Update via Agentic IDE" })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus({ level: "ok", message: `Pushed commit ${data.commitSha.slice(0,7)}.` });
    } catch (e: any) {
      setStatus({ level: "error", message: e.message || "Push failed" });
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input placeholder="GitHub token" value={token} onChange={(e) => setToken(e.target.value)} style={{ width: 220 }} />
      <input placeholder="owner" value={owner} onChange={(e) => setOwner(e.target.value)} style={{ width: 120 }} />
      <input placeholder="repo" value={repo} onChange={(e) => setRepo(e.target.value)} style={{ width: 140 }} />
      <input placeholder="branch" value={branch} onChange={(e) => setBranch(e.target.value)} style={{ width: 110 }} />
      <button onClick={doPull} disabled={disabled}>Pull</button>
      <button onClick={doPush} className="secondary" disabled={!token}>Push</button>
    </div>
  );
}
