"use client";

import { useMemo, useState } from "react";

type EmbedCodeBoxProps = {
  username: string;
};

type EmbedMode = "latest" | "feed";
type EmbedHeight = 100 | 200 | 300 | 420 | 600;

const latestHeightOptions: EmbedHeight[] = [100, 200];
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

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="${activeHeight}" style="border:0;border-radius:24px;overflow:hidden;display:block;" ${
    mode === "latest" ? `scrolling="no"` : ``
  } title="Quietli ${
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
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            Embed
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">
            Embed your blips
          </h2>
        </div>

        <p className="max-w-xl text-sm font-light leading-6 text-white/72 sm:text-right">
          Add your latest blip or your Quietli feed to a website, blog,
          portfolio, or little corner of the internet.
        </p>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/15 bg-white/15 p-4 sm:p-5">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 rounded-full border border-white/20 bg-white/15 p-1 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setMode("latest")}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
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
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
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
              className="w-full rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
            >
              Copy embed code
            </button>
          </div>

          <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Preview height
                </p>

                <p className="mt-1 text-xs font-light leading-5 text-white/60">
                  Choose how tall the embedded Quietli box should appear.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
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
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeHeight === height
                        ? "bg-white text-[#642B73]"
                        : "border border-white/25 bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {height}px
                  </button>
                ))}
              </div>
            </div>
          </div>

          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 sm:w-fit"
          >
            Open preview in a new tab
          </a>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Live preview</p>

            <p className="text-xs font-light text-white/55">
              {mode === "latest" ? "Latest blip" : "Blip feed"}
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/25 bg-white/20 p-2">
            <div
              className="mx-auto w-full overflow-hidden rounded-[1.25rem] bg-white/10"
              style={{
                height: activeHeight,
                minHeight: activeHeight,
              }}
            >
              <iframe
                src={embedUrl}
                title="Quietli embed preview"
                width="100%"
                height={activeHeight}
                scrolling={mode === "latest" ? "no" : "yes"}
                className="block w-full border-0"
                style={{
                  height: activeHeight,
                  border: 0,
                  overflow: mode === "latest" ? "hidden" : "auto",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-white/15 bg-white/15 p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Embed code</p>

            <p className="mt-1 text-xs font-light leading-5 text-white/60">
              Paste this iframe wherever your site allows custom embeds.
            </p>
          </div>
        </div>

        <pre className="max-h-56 overflow-auto rounded-[1rem] border border-white/10 bg-[#2b355f]/35 p-4 text-xs font-normal leading-6 text-white/80">
          <code className="block min-w-[520px] whitespace-pre-wrap break-words">
            {embedCode}
          </code>
        </pre>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-white/85">
          {message}
        </p>
      ) : null}
    </div>
  );
}