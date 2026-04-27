"use client";

import { useEffect } from "react";

export function EmbedPageMode() {
  useEffect(() => {
    document.documentElement.classList.add("embed-mode");

    return () => {
      document.documentElement.classList.remove("embed-mode");
    };
  }, []);

  return null;
}