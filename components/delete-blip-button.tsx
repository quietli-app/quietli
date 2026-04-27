"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeleteBlipButtonProps = {
  blipId: string;
};

export function DeleteBlipButton({ blipId }: DeleteBlipButtonProps) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function deleteBlip() {
    const confirmed = window.confirm("Delete this blip?");
    if (!confirmed) return;

    setDeleting(true);

    const { error } = await supabase.from("blips").delete().eq("id", blipId);

    setDeleting(false);

    if (error) {
      alert("Could not delete blip.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deleteBlip}
      disabled={deleting}
      className="rounded-full bg-white/30 px-3 py-1 text-xs font-bold text-[#642B73] transition hover:bg-white/50 disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}