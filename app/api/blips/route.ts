import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { moderateHateSpeech } from "@/lib/moderation/hate-speech";
import { createClient as createServerClient } from "@/lib/supabase/server";

const MAX_LENGTH = 240;

type PostBlipRequest = {
  content?: unknown;
};

async function readRequestBody(request: Request): Promise<PostBlipRequest> {
  try {
    return (await request.json()) as PostBlipRequest;
  } catch {
    return {};
  }
}

async function createAuthenticatedClient(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        },
      }
    );
  }

  return createServerClient();
}

export async function POST(request: Request) {
  const supabase = await createAuthenticatedClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        reason: "unauthenticated",
        message: "Sign in to post a blip.",
      },
      { status: 401 }
    );
  }

  const body = await readRequestBody(request);
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json(
      {
        ok: false,
        reason: "empty_content",
        message: "Write a tiny thought first.",
      },
      { status: 400 }
    );
  }

  if (content.length > MAX_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        reason: "too_long",
        message: `Keep your blip under ${MAX_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  const moderation = moderateHateSpeech(content);

  if (!moderation.allowed) {
    const reason =
      moderation.reason ??
      "Blocked by pre-post moderation before content was published.";

    const { error: flagError } = await supabase.from("moderation_flags").insert({
      user_id: user.id,
      flag_type: "hate_speech_prevention",
      reason,
    });

    if (flagError) {
      console.error("Error logging moderation prevention flag:", flagError);
    }

    return NextResponse.json(
      {
        ok: false,
        reason: "blocked_hate_speech",
        message: moderation.message,
        categories: moderation.categories,
      },
      { status: 200 }
    );
  }

  const { data, error } = await supabase.rpc("post_blip", {
    p_content: content,
  });

  if (error) {
    console.error("Error posting blip:", error);

    return NextResponse.json(
      {
        ok: false,
        reason: "post_failed",
        message: "Something went wrong posting your blip.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? { ok: true, message: "Blip posted." });
}
