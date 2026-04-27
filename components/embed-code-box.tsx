"use client";

import { useEffect, useState } from "react";

type EmbedCodeBoxProps = {
  username: string;
};

const heightOptions = [100, 250, 400, 600, 800];

export function EmbedCodeBox({ username }: EmbedCodeBoxProps) {
  const [copied, setCopied] = useState(false);

  // Default preview is now Latest only + 100px
  const [height, setHeight] = useState(100);
  const [mode, setMode] = useState<"feed" | "latest">("latest");

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const previewUrl =
    mode === "latest"
      ? `/embed/${username}?mode=latest`
      : `/embed/${username}`;

  const fullEmbedUrl = `${origin}${previewUrl}`;

  const embedCode = `<iframe src="${fullEmbedUrl}" width="100%" height="${height}" style="border:0;border-radius:24px;overflow:hidden;" loading="lazy"></iframe>`;

  async function copyEmbedCode() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  function handleModeChange(newMode: "feed" | "latest") {
    setMode(newMode);

    if (newMode === "latest" && height > 250) {
      setHeight(100);
    }

    if (newMode === "feed" && height < 250) {
      setHeight(600);
    }
  }

  function handleHeightChange(newHeight: number) {
    setHeight(newHeight);

    if (newHeight === 100) {
      setMode("latest");
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Embed your blips</p>
      <p className="mb-4 text-base text-slate-100">
        Choose a format, choose a height, then copy the iframe code into your
        website.
      </p>

      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-white">Format</p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleModeChange("feed")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "feed"
                ? "bg-white text-[#642B73]"
                : "bg-white/25 text-white hover:bg-white/35"
            }`}
          >
            Feed
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("latest")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "latest"
                ? "bg-white text-[#642B73]"
                : "bg-white/25 text-white hover:bg-white/35"
            }`}
          >
            Latest only
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-white">Height</p>

        <div className="flex flex-wrap gap-2">
          {heightOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleHeightChange(option)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                height === option
                  ? "bg-white text-[#642B73]"
                  : "bg-white/25 text-white hover:bg-white/35"
              }`}
            >
              {option}px
            </button>
          ))}
        </div>
      </div>

      <textarea
        readOnly
        value={embedCode}
        className="min-h-[120px] w-full resize-none rounded-[1rem] border border-white/30 bg-white/60 px-4 py-3 text-sm text-[#642B73] outline-none"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyEmbedCode}
          disabled={!origin}
          className="rounded-full bg-gradient-to-r from-[#C6426E] via-[#A13E7A] to-[#642B73] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {copied ? "Copied!" : "Copy embed code"}
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-white underline underline-offset-4"
        >
          Preview embed
        </a>
      </div>

      {copied ? (
        <p className="mt-3 text-sm text-emerald-100">
          Embed code copied to your clipboard.
        </p>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/10">
        <iframe
          src={previewUrl}
          width="100%"
          height={height}
          style={{
            border: 0,
            display: "block",
          }}
          loading="lazy"
        />
      </div>
    </div>
  );
}