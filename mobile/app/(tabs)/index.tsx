import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type AuthMode = "signin" | "signup";
type FeedView = "following" | "world";

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  gradient_theme?: string | null;
};

type RawBlip = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles:
    | {
        username: string;
        avatar_url: string | null;
        gradient_theme: string | null;
        profile_visibility: string | null;
      }
    | {
        username: string;
        avatar_url: string | null;
        gradient_theme: string | null;
        profile_visibility: string | null;
      }[]
    | null;
};

type FeedItem = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
  gradientTheme: string | null;
  profileVisibility: string | null;
};

type PostBlipResult = {
  ok: boolean;
  reason?: string;
  message?: string;
  seconds_remaining?: number;
};

const MAX_LENGTH = 240;
const COOLDOWN_SECONDS = 10;

const HOURLY_LIMIT_MESSAGE =
  "Hey buddy, are you ok? Maybe you need to chill on the blips for a minute... Have a tea, maybe meditate for a bit? Lets put the blips down for a little bit and come back to it when you're more relaxed.";

const themeBackgrounds: Record<string, string> = {
  blush: "#C6426E",
  violet: "#642B73",
  sky: "#76D7EA",
  mint: "#7DD8C5",
  sunset: "#F59E8B",
};

function cleanUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

function getProfileFromBlip(blip: RawBlip) {
  return Array.isArray(blip.profiles) ? blip.profiles[0] : blip.profiles;
}

function getBlipCardColor(theme?: string | null) {
  if (!theme) return themeBackgrounds.blush;

  return themeBackgrounds[theme] ?? themeBackgrounds.blush;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AvatarBubble({
  username,
  avatarUrl,
  size = 52,
}: {
  username: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.avatarCircle,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              borderRadius,
            },
          ]}
        />
      ) : (
        <Text style={styles.avatarInitial}>
          {username.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export default function QuietliMobileHome() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [feedView, setFeedView] = useState<FeedView>("following");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [composerText, setComposerText] = useState("");
  const [composerMessage, setComposerMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [authMessage, setAuthMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function openProfile(profileUsername: string) {
    setIsMenuOpen(false);

    router.push({
      pathname: "/profile/[username]",
      params: { username: profileUsername },
    } as never);
  }

  function openDiscover() {
    setIsMenuOpen(false);
    router.push("/explore" as never);
  }

  function openSettings() {
    setIsMenuOpen(false);
    router.push("/settings" as never);
  }

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setIsLoadingSession(false);

      if (currentSession?.user?.id) {
        const loadedProfile = await loadProfile(currentSession.user.id);
        await loadFeed("following", loadedProfile);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user?.id) {
        const loadedProfile = await loadProfile(nextSession.user.id);
        await loadFeed("following", loadedProfile);
      } else {
        setProfile(null);
        setFeed([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, gradient_theme")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading mobile profile:", error);
      return null;
    }

    setProfile(data);
    return data as Profile | null;
  }

  async function getFollowingIds(currentUserId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId)
      .eq("status", "accepted");

    if (error) {
      console.error("Error loading following list:", error);
      return [];
    }

    return data?.map((follow) => follow.following_id) ?? [];
  }

  async function getMutedIds(currentUserId: string) {
    const { data, error } = await supabase
      .from("mutes")
      .select("muted_id")
      .eq("muter_id", currentUserId);

    if (error) {
      console.error("Error loading muted users:", error);
      return [];
    }

    return data?.map((mute) => mute.muted_id) ?? [];
  }

  async function getBlockedUserIds(currentUserId: string) {
    const { data, error } = await supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);

    if (error) {
      console.error("Error loading blocked users:", error);
      return [];
    }

    return (
      data?.map((block) =>
        block.blocker_id === currentUserId ? block.blocked_id : block.blocker_id
      ) ?? []
    );
  }

  async function loadFeed(view: FeedView, currentProfile: Profile | null) {
    setIsLoadingFeed(true);

    let followingIds: string[] = [];
    let mutedIds: string[] = [];
    let blockedUserIds: string[] = [];

    if (currentProfile?.id) {
      mutedIds = await getMutedIds(currentProfile.id);
      blockedUserIds = await getBlockedUserIds(currentProfile.id);
    }

    if (view === "following") {
      if (!currentProfile?.id) {
        setFeed([]);
        setIsLoadingFeed(false);
        return;
      }

      followingIds = await getFollowingIds(currentProfile.id);

      if (followingIds.length === 0) {
        setFeed([]);
        setIsLoadingFeed(false);
        return;
      }
    }

    let query = supabase
      .from("blips")
      .select(
        `
        id,
        user_id,
        content,
        created_at,
        profiles!inner(username, avatar_url, gradient_theme, profile_visibility)
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (view === "following") {
      query = query.in("user_id", followingIds);
    }

    if (mutedIds.length > 0) {
      query = query.not("user_id", "in", `(${mutedIds.join(",")})`);
    }

    if (blockedUserIds.length > 0) {
      query = query.not("user_id", "in", `(${blockedUserIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading feed:", error);
      setFeed([]);
      setIsLoadingFeed(false);
      return;
    }

    let formattedFeed: FeedItem[] =
      (data as RawBlip[] | null)?.map((blip) => {
        const profileData = getProfileFromBlip(blip);

        return {
          id: blip.id,
          userId: blip.user_id,
          content: blip.content,
          createdAt: blip.created_at,
          username: profileData?.username ?? "unknown",
          avatarUrl: profileData?.avatar_url ?? null,
          gradientTheme: profileData?.gradient_theme ?? "blush",
          profileVisibility: profileData?.profile_visibility ?? "public",
        };
      }) ?? [];

    if (view === "world") {
      formattedFeed = formattedFeed.filter(
        (blip) => blip.profileVisibility !== "private"
      );
    }

    setFeed(formattedFeed);
    setIsLoadingFeed(false);
  }

  async function changeFeedView(view: FeedView) {
    setFeedView(view);
    await loadFeed(view, profile);
  }

  async function refreshFeed() {
    setIsRefreshing(true);
    await loadFeed(feedView, profile);
    setIsRefreshing(false);
  }

  async function signIn() {
    setIsSubmitting(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("");
  }

  async function signUp() {
    setIsSubmitting(true);
    setAuthMessage("");

    const finalUsername = cleanUsername(username);

    if (!finalUsername || finalUsername.length < 3) {
      setIsSubmitting(false);
      setAuthMessage("Please choose a username with at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setIsSubmitting(false);
      setAuthMessage("Please choose a password with at least 6 characters.");
      return;
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", finalUsername)
      .maybeSingle();

    if (existingProfile) {
      setIsSubmitting(false);
      setAuthMessage("That username is already taken.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: finalUsername,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage(
      "Almost there. Check your email for the Quietli confirmation link, then come back and sign in."
    );
  }

  async function signOut() {
    setIsMenuOpen(false);
    await supabase.auth.signOut();
    setProfile(null);
    setFeed([]);
    setAuthMessage("");
    setComposerMessage("");
  }

  async function handleAuthSubmit() {
    if (!email.trim() || !password) {
      setAuthMessage("Please enter your email and password.");
      return;
    }

    if (authMode === "signin") {
      await signIn();
    } else {
      await signUp();
    }
  }

  async function postBlip() {
    const trimmedContent = composerText.trim();

    if (!trimmedContent) {
      setComposerMessage("Write a tiny thought first.");
      return;
    }

    if (trimmedContent.length > MAX_LENGTH) {
      setComposerMessage(`Keep your blip under ${MAX_LENGTH} characters.`);
      return;
    }

    if (cooldownSeconds > 0) {
      setComposerMessage(
        `Give it ${cooldownSeconds} more second${
          cooldownSeconds === 1 ? "" : "s"
        } before posting another blip.`
      );
      return;
    }

    setIsSubmitting(true);
    setComposerMessage("");

    const { data, error } = await supabase.rpc("post_blip", {
      p_content: trimmedContent,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error posting mobile blip:", error);
      setComposerMessage("Something went wrong posting your blip.");
      return;
    }

    const result = data as PostBlipResult | null;

    if (!result?.ok) {
      if (result?.reason === "cooldown") {
        const secondsRemaining =
          typeof result.seconds_remaining === "number"
            ? result.seconds_remaining
            : COOLDOWN_SECONDS;

        setCooldownSeconds(secondsRemaining);
        setComposerMessage(
          `Give it ${secondsRemaining} more second${
            secondsRemaining === 1 ? "" : "s"
          } before posting another blip.`
        );
        return;
      }

      if (result?.reason === "hourly_limit") {
        setComposerMessage(HOURLY_LIMIT_MESSAGE);
        return;
      }

      if (result?.reason === "possible_bot_spam") {
        setComposerMessage(
          "Quietli noticed a suspiciously fast burst of posting attempts. Posting has been paused for review."
        );
        return;
      }

      setComposerMessage(
        result?.message ?? "Something went wrong posting your blip."
      );
      return;
    }

    setComposerText("");
    setCooldownSeconds(COOLDOWN_SECONDS);
    setComposerMessage(result.message ?? "Blip posted.");
    await loadFeed(feedView, profile);
  }

  if (isLoadingSession) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.loadingText}>Opening Quietli...</Text>
      </View>
    );
  }

  if (session) {
    const charactersLeft = MAX_LENGTH - composerText.length;
    const currentUsername = profile?.username || "quietli_user";

    return (
      <>
        <KeyboardAvoidingView
          style={styles.keyboardScreen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.feedContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refreshFeed} />
            }
          >
            <View style={styles.mobileHeader}>
              <Pressable
                style={styles.mobileHeaderProfile}
                onPress={() => openProfile(currentUsername)}
              >
                <AvatarBubble
                  username={currentUsername}
                  avatarUrl={profile?.avatar_url ?? null}
                  size={46}
                />

                <View>
                  <Text style={styles.logoText}>Quietli</Text>
                  <Text style={styles.headerSubtext}>@{currentUsername}</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.menuButton}
                onPress={() => setIsMenuOpen(true)}
              >
                <Text style={styles.menuButtonText}>Menu</Text>
              </Pressable>
            </View>

            <View style={styles.composerCard}>
              <TextInput
                value={composerText}
                onChangeText={(value) => {
                  setComposerText(value);
                  setComposerMessage("");
                }}
                multiline
                maxLength={MAX_LENGTH}
                placeholder="What floated through your brain?"
                placeholderTextColor="rgba(100, 43, 115, 0.45)"
                style={styles.composerInput}
              />

              <View style={styles.composerFooter}>
                <Text style={styles.characterCount}>
                  {charactersLeft} characters left
                </Text>

                <Pressable
                  style={[
                    styles.postButton,
                    (isSubmitting || cooldownSeconds > 0) &&
                      styles.disabledButton,
                  ]}
                  onPress={postBlip}
                  disabled={isSubmitting || cooldownSeconds > 0}
                >
                  <Text style={styles.postButtonText}>
                    {isSubmitting
                      ? "Posting..."
                      : cooldownSeconds > 0
                        ? `Pause ${cooldownSeconds}s`
                        : "Post blip"}
                  </Text>
                </Pressable>
              </View>

              {composerMessage ? (
                <Text style={styles.composerMessage}>{composerMessage}</Text>
              ) : null}
            </View>

            <View style={styles.feedToggleRow}>
              <View style={styles.feedToggle}>
                <Pressable
                  style={[
                    styles.feedToggleButton,
                    feedView === "following" && styles.feedToggleButtonActive,
                  ]}
                  onPress={() => changeFeedView("following")}
                >
                  <Text
                    style={[
                      styles.feedToggleButtonText,
                      feedView === "following" &&
                        styles.feedToggleButtonTextActive,
                    ]}
                  >
                    Following
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.feedToggleButton,
                    feedView === "world" && styles.feedToggleButtonActive,
                  ]}
                  onPress={() => changeFeedView("world")}
                >
                  <Text
                    style={[
                      styles.feedToggleButtonText,
                      feedView === "world" && styles.feedToggleButtonTextActive,
                    ]}
                  >
                    World View
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.feedHint}>
              {feedView === "following"
                ? "Blips from the quiet corners you follow."
                : "The latest public blips drifting through Quietli."}
            </Text>

            {isLoadingFeed ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.emptyText}>Loading blips...</Text>
              </View>
            ) : feed.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {feedView === "following"
                    ? "You’re not following anyone yet."
                    : "No public blips yet."}
                </Text>

                <Text style={styles.emptyText}>
                  {feedView === "following"
                    ? "Switch to World View to discover public blips."
                    : "Quiet out here. Be the first to toss a thought into the world."}
                </Text>

                {feedView === "following" ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => changeFeedView("world")}
                  >
                    <Text style={styles.secondaryButtonText}>View World</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.feedList}>
                {feed.map((blip) => (
                  <View
                    key={blip.id}
                    style={[
                      styles.blipCard,
                      { backgroundColor: getBlipCardColor(blip.gradientTheme) },
                    ]}
                  >
                    <Pressable
                      style={styles.blipHeader}
                      onPress={() => openProfile(blip.username)}
                    >
                      <AvatarBubble
                        username={blip.username}
                        avatarUrl={blip.avatarUrl}
                      />

                      <View style={styles.blipHeaderText}>
                        <Text style={styles.blipUsername}>@{blip.username}</Text>
                        <Text style={styles.blipDate}>
                          {formatDate(blip.createdAt)}
                        </Text>
                      </View>
                    </Pressable>

                    <Text style={styles.blipContent}>{blip.content}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={isMenuOpen} transparent animationType="fade">
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setIsMenuOpen(false)}
          >
            <Pressable style={styles.menuCard}>
              <Text style={styles.menuKicker}>Quietli</Text>
              <Text style={styles.menuTitle}>Menu</Text>

              <Pressable
                style={styles.menuItem}
                onPress={() => openProfile(currentUsername)}
              >
                <Text style={styles.menuItemText}>My profile</Text>
              </Pressable>

              <Pressable style={styles.menuItem} onPress={openDiscover}>
                <Text style={styles.menuItemText}>Discover</Text>
              </Pressable>

              <Pressable style={styles.menuItem} onPress={openSettings}>
                <Text style={styles.menuItemText}>Settings</Text>
              </Pressable>

              <Pressable style={styles.menuItemDanger} onPress={signOut}>
                <Text style={styles.menuItemDangerText}>Sign out</Text>
              </Pressable>

              <Pressable
                style={styles.menuClose}
                onPress={() => setIsMenuOpen(false)}
              >
                <Text style={styles.menuCloseText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardScreen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authCard}>
          <Text style={styles.logoText}>Quietli</Text>

          <Text style={styles.title}>
            {authMode === "signin" ? "Welcome back." : "Join Quietli."}
          </Text>

          <Text style={styles.bodyText}>
            {authMode === "signin"
              ? "Sign in to your quiet corner."
              : "Create an account and start posting tiny, low-stakes blips."}
          </Text>

          <View style={styles.modeToggle}>
            <Pressable
              style={[
                styles.modeButton,
                authMode === "signin" && styles.modeButtonActive,
              ]}
              onPress={() => {
                setAuthMode("signin");
                setAuthMessage("");
              }}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  authMode === "signin" && styles.modeButtonTextActive,
                ]}
              >
                Sign in
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modeButton,
                authMode === "signup" && styles.modeButtonActive,
              ]}
              onPress={() => {
                setAuthMode("signup");
                setAuthMessage("");
              }}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  authMode === "signup" && styles.modeButtonTextActive,
                ]}
              >
                Sign up
              </Text>
            </Pressable>
          </View>

          {authMode === "signup" ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>

              <TextInput
                value={username}
                onChangeText={(value) => setUsername(cleanUsername(value))}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="quietwallflower"
                placeholderTextColor="rgba(100, 43, 115, 0.45)"
                style={styles.input}
              />

              <Text style={styles.helpText}>
                Letters, numbers, and underscores only.
              </Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="rgba(100, 43, 115, 0.45)"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="rgba(100, 43, 115, 0.45)"
              style={styles.input}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            onPress={handleAuthSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting
                ? authMode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
                : authMode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Text>
          </Pressable>

          {authMessage ? (
            <Text style={styles.messageText}>{authMessage}</Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardScreen: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "#642B73",
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#642B73",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "300",
  },
  authContent: {
    minHeight: "100%",
    justifyContent: "center",
    padding: 18,
  },
  authCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 32,
    padding: 22,
  },
  mobileHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    marginTop: 12,
  },
  mobileHeaderProfile: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 10,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  menuButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "300",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  headerSubtext: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "300",
  },
  feedContent: {
    padding: 18,
    paddingBottom: 36,
  },
  title: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "600",
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  bodyText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: "300",
    lineHeight: 25,
    marginTop: 14,
  },
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    padding: 4,
    marginTop: 24,
    marginBottom: 18,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 10,
  },
  modeButtonActive: {
    backgroundColor: "#ffffff",
  },
  modeButtonText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "400",
  },
  modeButtonTextActive: {
    color: "#642B73",
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 18,
    color: "#642B73",
    fontSize: 16,
    fontWeight: "300",
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  helpText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 7,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    marginTop: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#642B73",
    fontSize: 15,
    fontWeight: "500",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "300",
  },
  disabledButton: {
    opacity: 0.55,
  },
  messageText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 21,
    marginTop: 16,
    textAlign: "center",
  },
  composerCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30,
    marginBottom: 18,
    padding: 16,
  },
  composerInput: {
    minHeight: 110,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 22,
    color: "#642B73",
    fontSize: 16,
    fontWeight: "300",
    lineHeight: 23,
    paddingHorizontal: 15,
    paddingVertical: 13,
    textAlignVertical: "top",
  },
  composerFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  characterCount: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    fontWeight: "300",
  },
  postButton: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  postButtonText: {
    color: "#642B73",
    fontSize: 14,
    fontWeight: "400",
  },
  composerMessage: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 20,
    marginTop: 12,
  },
  feedToggleRow: {
    alignItems: "center",
    marginBottom: 10,
  },
  feedToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
  },
  feedToggleButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  feedToggleButtonActive: {
    backgroundColor: "#ffffff",
  },
  feedToggleButtonText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "300",
  },
  feedToggleButtonTextActive: {
    color: "#642B73",
  },
  feedHint: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  feedList: {
    gap: 14,
  },
  blipCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 30,
    padding: 18,
  },
  blipHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  avatarImage: {
    resizeMode: "cover",
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "300",
  },
  blipHeaderText: {
    flex: 1,
  },
  blipUsername: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "400",
  },
  blipDate: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 2,
  },
  blipContent: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 17,
    fontWeight: "300",
    lineHeight: 27,
  },
  emptyCard: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30,
    padding: 24,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    fontWeight: "300",
    lineHeight: 23,
    marginTop: 10,
    textAlign: "center",
  },
  menuOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 5, 28, 0.55)",
    padding: 18,
  },
  menuCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#642B73",
    borderRadius: 30,
    padding: 18,
  },
  menuKicker: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "300",
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  menuTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "500",
    marginBottom: 16,
  },
  menuItem: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "300",
  },
  menuItemDanger: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemDangerText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    fontWeight: "300",
  },
  menuClose: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    marginTop: 4,
    paddingVertical: 12,
  },
  menuCloseText: {
    color: "#642B73",
    fontSize: 15,
    fontWeight: "400",
  },
});