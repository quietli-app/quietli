"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { AvatarUpload } from "@/components/avatar-upload";
import { ThemeToggle } from "@/components/theme-toggle";

export function ProfileControls({ profileId }: { profileId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setIsOwnProfile(user?.id === profileId);
      setChecked(true);
    }

    void checkUser();
    return () => {
      mounted = false;
    };
  }, [profileId, supabase]);

  if (!checked || !isOwnProfile) return null;

  return (
    <div className="mt-6 grid gap-4">
      <AvatarUpload userId={profileId} />
      <ThemeToggle />
    </div>
  );
}
