"use client";

import { useMemo, useState } from "react";

type EmbedCodeBoxProps = {
  username: string;
};

type EmbedMode = "latest" | "feed";
type EmbedHeight = 100 | 200 | 300 | 420 | 600;

const latestHeightOptions: EmbedHeight[] = [100, 200, 300, 420, 600];
const feedHeightOptions: EmbedHeight[] = [300, 420, 600];

export function EmbedCodeBox({ username }: EmbedCodeBoxProps) {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<EmbedMode>("latest");
  const [latestHeight, setLatestHeight] = useState<EmbedHeight>(100);
  const [feedHeight, setFeedHeight] = useState<EmbedHeight>(420);

  const activeHeight = mode === "latest" ? latestHeight : feedHeight;

  const embedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";

    return `${window.location.origin}/embed/${username}?variant=${mode}&height=${activeHeight}`;
  }, [username, mode, activeHeight]);

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="${activeHeight}" style="border:0;border-radius:24px;overflow:hidden;display:block;" scrolling="no" title="Quietli ${
    mode === "latest" ? "latest blip" : "blip feed"
  }"></iframe>`;

  async function copyEmbedCode() {
    setMessage("");

    try {
      await navigator.clipboard.writeText(embedCode);
      setMessage("Embed code copied.");
    } catch {
      setMessage(
        "Could not copy automatically. You can select and copy it manually."
      );
    }
  }

  const heightOptions =
    mode === "latest" ? latestHeightOptions : feedHeightOptions;

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-semibold text-white">Embed your blips</p>

      <p className="mb-5 text-base font-normal leading-7 text-slate-100">
        Add your latest blip or your Quietli feed to a website, blog, portfolio,
        or little corner of the internet.
      </p>

      <div className="rounded-[1.5rem] border border-white/15 bg-white/15 p-4">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-2 rounded-full border border-white/20 bg-white/15 p-1 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setMode("latest")}
              className={`rounded-full px-5 py-2 text-sm font-normal transition ${
                mode === "latest"
                  ? "bg-white text-[#642B73]"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              Latest Blip
            </button>

            <button
              type="button"
              onClick={() => setMode("feed")}
              className={`rounded-full px-5 py-2 text-sm font-normal transition ${
                mode === "feed"
                  ? "bg-white text-[#642B73]"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              Blip Feed
            </button>
          </div>

          <button
            type="button"
            onClick={copyEmbedCode}
            className="rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-3 text-sm font-normal text-white transition hover:brightness-110"
          >
            Copy embed code
          </button>

          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-normal text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
          >
            Preview embed
          </a>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm font-normal text-white/75">
            Preview height
          </p>

          {heightOptions.map((height) => (
            <button
              key={height}
              type="button"
              onClick={() => {
                if (mode === "latest") {
                  setLatestHeight(height);
                } else {
                  setFeedHeight(height);
                }
              }}
              className={`rounded-full px-4 py-2 text-sm font-normal transition ${
                activeHeight === height
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
          style={{ height: activeHeight }}
        >
          <iframe
            src={embedUrl}
            title="Quietli embed preview"
            width="100%"
            height={activeHeight}
            scrolling="no"
            className="block w-full border-0"
            style={{
              height: activeHeight,
              border: 0,
              overflow: "hidden",
              display: "block",
            }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-white/15 bg-white/15 p-4">
        <p className="mb-2 text-sm font-normal text-white">Embed code</p>

        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-[1rem] bg-white/15 p-4 text-xs font-normal leading-6 text-white/75">
          {embedCode}
        </pre>
      </div>

      {message ? <p className="mt-4 text-sm text-white/85">{message}</p> : null}
    </div>
  );
}