"use client";

import { useMemo, useState } from "react";

type EmbedCodeBoxProps = {
  username: string;
};

type LatestEmbedHeight = 100 | 200 | 300;

const latestHeightOptions: LatestEmbedHeight[] = [100, 200, 300];

export function EmbedCodeBox({ username }: EmbedCodeBoxProps) {
  const [message, setMessage] = useState("");
  const [latestHeight, setLatestHeight] = useState<LatestEmbedHeight>(100);

  const latestEmbedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/embed/${username}?variant=latest&height=${latestHeight}`;
  }, [username, latestHeight]);

  const feedEmbedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/embed/${username}?variant=feed`;
  }, [username]);

  const latestEmbedCode = `<iframe src="${latestEmbedUrl}" width="100%" height="${latestHeight}" style="border:0;border-radius:24px;overflow:hidden;display:block;" scrolling="no" title="Quietli latest blip"></iframe>`;

  const feedEmbedCode = `<iframe src="${feedEmbedUrl}" width="100%" height="420" style="border:0;border-radius:24px;overflow:hidden;display:block;" title="Quietli feed"></iframe>`;

  async function copyEmbedCode(code: string) {
    setMessage("");

    try {
      await navigator.clipboard.writeText(code);
      setMessage("Embed code copied.");
    } catch {
      setMessage(
        "Could not copy automatically. You can select and copy it manually."
      );
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Embed your blips</p>

      <p className="mb-5 text-base leading-7 text-slate-100">
        Add your latest blip or your Quietli feed to a website, blog, portfolio,
        or little corner of the internet.
      </p>

      <div className="grid gap-6">
        <section className="rounded-[1.5rem] border border-white/15 bg-white/15 p-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => copyEmbedCode(latestEmbedCode)}
              className="rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
            >
              Copy latest blip embed
            </button>

            <a
              href={latestEmbedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
            >
              Preview latest embed
            </a>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="mr-2 text-sm font-bold text-white/75">
              Preview height
            </p>

            {latestHeightOptions.map((height) => (
              <button
                key={height}
                type="button"
                onClick={() => setLatestHeight(height)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  latestHeight === height
                    ? "bg-white text-[#642B73]"
                    : "border border-white/25 bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {height}px
              </button>
            ))}
          </div>

          <div
            className="overflow-hidden rounded-[1.5rem] border border-white/25 bg-white/20"
            style={{ height: latestHeight }}
          >
            <iframe
              src={latestEmbedUrl}
              title="Quietli latest blip embed preview"
              width="100%"
              height={latestHeight}
              scrolling="no"
              className="block w-full border-0"
              style={{
                height: latestHeight,
                border: 0,
                overflow: "hidden",
                display: "block",
              }}
            />
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/15 bg-white/15 p-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => copyEmbedCode(feedEmbedCode)}
              className="rounded-full border border-white/30 bg-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/30"
            >
              Copy feed embed
            </button>

            <a
              href={feedEmbedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
            >
              Preview feed embed
            </a>
          </div>

          <div className="h-[420px] overflow-hidden rounded-[1.5rem] border border-white/25 bg-white/20">
            <iframe
              src={feedEmbedUrl}
              title="Quietli feed embed preview"
              width="100%"
              height="420"
              className="block h-[420px] w-full border-0"
              style={{
                border: 0,
                overflow: "hidden",
                display: "block",
              }}
            />
          </div>
        </section>

        <div className="rounded-[1.25rem] border border-white/15 bg-white/15 p-4">
          <p className="mb-2 text-sm font-bold text-white">
            Latest blip embed code
          </p>

          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-[1rem] bg-white/15 p-4 text-xs leading-6 text-white/75">
            {latestEmbedCode}
          </pre>
        </div>

        <div className="rounded-[1.25rem] border border-white/15 bg-white/15 p-4">
          <p className="mb-2 text-sm font-bold text-white">Feed embed code</p>

          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-[1rem] bg-white/15 p-4 text-xs leading-6 text-white/75">
            {feedEmbedCode}
          </pre>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-white/85">{message}</p> : null}
    </div>
  );
}