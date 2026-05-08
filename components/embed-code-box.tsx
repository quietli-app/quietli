"use client";

import { useMemo, useState } from "react";

type EmbedCodeBoxProps = {
  username: string;
};

type EmbedMode = "latest" | "feed";
type LatestEmbedSize = "compact" | "standard" | "large";
type FeedEmbedHeight = 300 | 420 | 600;

const latestSizeOptions: {
  label: string;
  value: LatestEmbedSize;
  height: number;
  description: string;
}[] = [
  {
    label: "Compact",
    value: "compact",
    height: 100,
    description: "Small preview",
  },
  {
    label: "Standard",
    value: "standard",
    height: 152,
    description: "Recommended",
  },
  {
    label: "Large",
    value: "large",
    height: 220,
    description: "Roomier display",
  },
];

const feedHeightOptions: FeedEmbedHeight[] = [300, 420, 600];

export function EmbedCodeBox({ username }: EmbedCodeBoxProps) {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<EmbedMode>("latest");
  const [latestSize, setLatestSize] = useState<LatestEmbedSize>("compact");
  const [feedHeight, setFeedHeight] = useState<FeedEmbedHeight>(420);

  const selectedLatestOption =
    latestSizeOptions.find((option) => option.value === latestSize) ??
    latestSizeOptions[0];

  const activeHeight =
    mode === "latest" ? selectedLatestOption.height : feedHeight;

  const embedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";

    if (mode === "latest") {
      return `${window.location.origin}/embed/${username}?variant=latest&size=${latestSize}`;
    }

    return `${window.location.origin}/embed/${username}?variant=feed&height=${feedHeight}`;
  }, [username, mode, latestSize, feedHeight]);

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="${activeHeight}" style="border:0;border-radius:24px;overflow:hidden;display:block;" scrolling="${
    mode === "latest" ? "no" : "yes"
  }" loading="lazy" title="Quietli ${
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

  return (
    <div className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/20 p-4 text-white backdrop-blur-xl sm:p-6">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
          Embed
        </p>

        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
          Embed your blips
        </h2>

        <p className="max-w-xl text-sm font-light leading-6 text-white/72">
          Add your latest blip or your Quietli feed to a website, blog,
          portfolio, or little corner of the internet.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid w-full grid-cols-2 rounded-full border border-white/20 bg-white/15 p-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMode("latest")}
            className={`min-w-0 rounded-full px-3 py-2.5 text-sm font-medium transition ${
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
            className={`min-w-0 rounded-full px-3 py-2.5 text-sm font-medium transition ${
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
          className="w-full rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-3 text-center text-sm font-semibold text-white transition hover:brightness-110"
        >
          Copy embed code
        </button>

        {mode === "latest" ? (
          <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-4">
            <p className="text-sm font-semibold text-white">Embed size</p>

            <p className="mt-1 text-xs font-light leading-5 text-white/60">
              Choose a Spotify-style preset for your latest blip.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {latestSizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLatestSize(option.value)}
                  className={`rounded-[1rem] border px-4 py-3 text-left transition ${
                    latestSize === option.value
                      ? "border-white bg-white text-[#642B73]"
                      : "border-white/25 bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>

                  <span
                    className={`mt-1 block text-xs ${
                      latestSize === option.value
                        ? "text-[#642B73]/70"
                        : "text-white/60"
                    }`}
                  >
                    {option.height}px · {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-4">
            <p className="text-sm font-semibold text-white">Feed height</p>

            <p className="mt-1 text-xs font-light leading-5 text-white/60">
              Choose how tall the embedded Quietli feed should appear.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {feedHeightOptions.map((height) => (
                <button
                  key={height}
                  type="button"
                  onClick={() => setFeedHeight(height)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    feedHeight === height
                      ? "bg-white text-[#642B73]"
                      : "border border-white/25 bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {height}px
                </button>
              ))}
            </div>
          </div>
        )}

        <a
          href={embedUrl}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-white/20"
        >
          Open preview in a new tab
        </a>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Live preview</p>

          <p className="text-xs font-light text-white/55">
            {mode === "latest"
              ? `${selectedLatestOption.label} latest blip`
              : "Blip feed"}
          </p>
        </div>

        <div
          className="w-full max-w-full overflow-hidden rounded-[24px] bg-transparent"
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
            className="block w-full max-w-full border-0"
            style={{
              height: activeHeight,
              border: 0,
              overflow: mode === "latest" ? "hidden" : "auto",
              display: "block",
            }}
          />
        </div>
      </div>

      <div className="mt-5 w-full max-w-full overflow-hidden rounded-[1.25rem] border border-white/15 bg-white/15 p-4">
        <p className="text-sm font-semibold text-white">Embed code</p>

        <p className="mt-1 text-xs font-light leading-5 text-white/60">
          Paste this iframe wherever your site allows custom embeds.
        </p>

        <pre className="mt-3 max-h-56 w-full max-w-full overflow-x-auto overflow-y-auto rounded-[1rem] border border-white/10 bg-[#2b355f]/35 p-4 text-xs font-normal leading-6 text-white/80">
          <code className="block whitespace-pre-wrap break-all">
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