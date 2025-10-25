import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, owner, repo, branch } = await req.json();
    if (!token || !owner || !repo || !branch) {
      return new NextResponse("Missing params", { status: 400 });
    }

    // Resolve branch ref to head commit
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}` , {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!refRes.ok) {
      const text = await refRes.text();
      return new NextResponse(text, { status: refRes.status });
    }
    const refJson: any = await refRes.json();
    const headCommitSha: string = refJson.object?.sha;
    if (!headCommitSha) return new NextResponse("Unable to resolve head commit", { status: 500 });

    // Fetch commit to get base tree
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${headCommitSha}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!commitRes.ok) {
      const text = await commitRes.text();
      return new NextResponse(text, { status: commitRes.status });
    }
    const commitJson: any = await commitRes.json();
    const baseTreeSha: string = commitJson.tree?.sha;
    if (!baseTreeSha) return new NextResponse("Unable to resolve base tree", { status: 500 });

    // List all files under the tree (recursive)
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${baseTreeSha}?recursive=1`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!treeRes.ok) {
      const text = await treeRes.text();
      return new NextResponse(text, { status: treeRes.status });
    }
    const treeJson: any = await treeRes.json();
    const files = (treeJson.tree || []).filter((t: any) => t.type === "blob");

    const out: { path: string; name: string; content: string }[] = [];
    await Promise.all(
      files.map(async (file: any) => {
        const blobRes = await fetch(file.url, { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } });
        if (!blobRes.ok) return;
        const blobJson: any = await blobRes.json();
        const b64 = String(blobJson.content || "").replace(/\n/g, "");
        const content = Buffer.from(b64, "base64").toString("utf8");
        out.push({ path: file.path, name: file.path.split("/").pop() || file.path, content });
      })
    );

    return NextResponse.json({ files: out, headCommitSha, baseTreeSha });
  } catch (e: any) {
    return new NextResponse(e.message || "Server error", { status: 500 });
  }
}
