import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, files, repoRef, headCommitSha, baseTreeSha, message } = body || {};
    if (!token) return new NextResponse("Missing token", { status: 400 });
    if (!repoRef || !headCommitSha || !baseTreeSha || !Array.isArray(files) || files.length === 0) {
      return new NextResponse("Missing repoRef/headCommitSha/baseTreeSha/files", { status: 400 });
    }

    const { owner, repo, branch } = repoRef;

    // Create blobs for each file
    const blobs: { path: string; sha: string; mode: string; type: string }[] = [];
    for (const f of files) {
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
        body: JSON.stringify({ content: Buffer.from(f.content, "utf8").toString("base64"), encoding: "base64" })
      });
      if (!blobRes.ok) {
        const text = await blobRes.text();
        return new NextResponse(text, { status: blobRes.status });
      }
      const blobJson: any = await blobRes.json();
      blobs.push({ path: f.path, sha: blobJson.sha, mode: "100644", type: "blob" });
    }

    // Create tree based on baseTreeSha
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify({ base_tree: baseTreeSha, tree: blobs })
    });
    if (!treeRes.ok) {
      const text = await treeRes.text();
      return new NextResponse(text, { status: treeRes.status });
    }
    const treeJson: any = await treeRes.json();

    // Create commit
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify({ message: message || "agentic-ide commit", tree: treeJson.sha, parents: [headCommitSha] })
    });
    if (!commitRes.ok) {
      const text = await commitRes.text();
      return new NextResponse(text, { status: commitRes.status });
    }
    const commitJson: any = await commitRes.json();

    // Update ref
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify({ sha: commitJson.sha, force: false })
    });
    if (!refRes.ok) {
      const text = await refRes.text();
      return new NextResponse(text, { status: refRes.status });
    }

    return NextResponse.json({ commitSha: commitJson.sha });
  } catch (e: any) {
    return new NextResponse(e.message || "Server error", { status: 500 });
  }
}
