import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { getMobileGradientTheme } from "../../lib/mobile-gradient-themes";

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  gradient_theme: string | null;
  profile_visibility: string | null;
  profile_link_label: string | null;
  profile_link_url: string | null;
};

type Blip = {
  id: string;
  content: string;
  created_at: string;
};

type FollowStatus = "none" | "pending" | "accepted";

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
  size = 88,
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

export default function MobileProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ username?: string }>();

  const username = Array.isArray(params.username)
    ? params.username[0]
    : params.username;

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blips, setBlips] = useState<Blip[]>([]);
  const [followStatus, setFollowStatus] = useState<FollowStatus>("none");
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [followMessage, setFollowMessage] = useState("");

  async function getCurrentSession() {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);
    return currentSession;
  }

  async function loadFollowStatus(currentUserId: string, targetUserId: string) {
    const { data, error } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (error) {
      console.error("Error loading mobile follow status:", error);
      setFollowStatus("none");
      return "none" as FollowStatus;
    }

    const status =
      data?.status === "accepted" || data?.status === "pending"
        ? data.status
        : "none";

    setFollowStatus(status);
    return status as FollowStatus;
  }

  async function loadProfile() {
    if (!username) {
      setMessage("No profile username was provided.");
      setIsLoading(false);
      return;
    }

    setMessage("");
    setFollowMessage("");

    const currentSession = await getCurrentSession();

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, username, bio, avatar_url, gradient_theme, profile_visibility, profile_link_label, profile_link_url"
      )
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      console.error("Error loading mobile profile:", profileError);
      setMessage("Something went wrong loading this profile.");
      setIsLoading(false);
      return;
    }

    if (!profileData) {
      setMessage("This Quietli profile could not be found.");
      setIsLoading(false);
      return;
    }

    const typedProfile = profileData as Profile;
    const currentUserId = currentSession?.user?.id ?? null;
    const ownProfile = currentUserId === typedProfile.id;

    setProfile(typedProfile);
    setIsOwnProfile(ownProfile);

    let currentFollowStatus: FollowStatus = "none";

    if (currentUserId && !ownProfile) {
      currentFollowStatus = await loadFollowStatus(
        currentUserId,
        typedProfile.id
      );
    } else {
      setFollowStatus("none");
    }

    const canViewBlips =
      typedProfile.profile_visibility !== "private" ||
      ownProfile ||
      currentFollowStatus === "accepted";

    if (!canViewBlips) {
      setBlips([]);
      setIsLoading(false);
      return;
    }

    const { data: blipData, error: blipError } = await supabase
      .from("blips")
      .select("id, content, created_at")
      .eq("user_id", typedProfile.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (blipError) {
      console.error("Error loading mobile profile blips:", blipError);
      setMessage("Something went wrong loading this profile’s blips.");
      setIsLoading(false);
      return;
    }

    setBlips((blipData ?? []) as Blip[]);
    setIsLoading(false);
  }

  async function refreshProfile() {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  }

  async function followOrRequest() {
    if (!session?.user?.id) {
      setFollowMessage("Please sign in to follow people.");
      return;
    }

    if (!profile || isOwnProfile) return;

    setIsFollowLoading(true);
    setFollowMessage("");

    const nextStatus =
      profile.profile_visibility === "private" ? "pending" : "accepted";

    const { error } = await supabase.from("follows").upsert(
      {
        follower_id: session.user.id,
        following_id: profile.id,
        status: nextStatus,
      },
      {
        onConflict: "follower_id,following_id",
      }
    );

    setIsFollowLoading(false);

    if (error) {
      console.error("Error following profile on mobile:", error);
      setFollowMessage("Something went wrong. Try again in a moment.");
      return;
    }

    setFollowStatus(nextStatus);

    if (nextStatus === "pending") {
      setFollowMessage("Follow request sent.");
    } else {
      setFollowMessage("You’re now following this profile.");
      await loadProfile();
    }
  }

  async function unfollowOrCancelRequest() {
    if (!session?.user?.id || !profile || isOwnProfile) return;

    setIsFollowLoading(true);
    setFollowMessage("");

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", session.user.id)
      .eq("following_id", profile.id);

    setIsFollowLoading(false);

    if (error) {
      console.error("Error unfollowing profile on mobile:", error);
      setFollowMessage("Something went wrong. Try again in a moment.");
      return;
    }

    setFollowStatus("none");
    setFollowMessage(
      profile.profile_visibility === "private"
        ? "Follow request canceled."
        : "You unfollowed this profile."
    );

    await loadProfile();
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#C6426E", "#642B73"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientScreen}
      >
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#ffffff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient
        colors={["#C6426E", "#642B73"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientScreen}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.loadingScreen}>
            <Text style={styles.emptyTitle}>Profile unavailable</Text>
            <Text style={styles.emptyText}>{message}</Text>

            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const profileGradient = getMobileGradientTheme(profile.gradient_theme);
  const isPrivate = profile.profile_visibility === "private";
  const canViewBlips = !isPrivate || isOwnProfile || followStatus === "accepted";

  const followButtonLabel =
    followStatus === "accepted"
      ? "Unfollow"
      : followStatus === "pending"
        ? "Requested"
        : isPrivate
          ? "Request follow"
          : "Follow";

  return (
    <LinearGradient
      colors={["#C6426E", "#642B73"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientScreen}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshProfile}
            />
          }
        >
          <View style={styles.topRow}>
            <Pressable
              style={styles.backButtonSmall}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <Text style={styles.topTitle}>Quietli</Text>
          </View>

          <LinearGradient
            colors={profileGradient.colors}
            start={profileGradient.start}
            end={profileGradient.end}
            style={styles.profileCard}
          >
            <AvatarBubble
              username={profile.username}
              avatarUrl={profile.avatar_url}
              size={90}
            />

            <Text style={styles.username}>@{profile.username}</Text>

            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            {profile.profile_link_label && profile.profile_link_url ? (
              <Text style={styles.profileLink}>{profile.profile_link_label}</Text>
            ) : null}

            {!isOwnProfile ? (
              <View style={styles.followArea}>
                <Pressable
                  style={[
                    styles.followButton,
                    followStatus === "accepted" && styles.followButtonMuted,
                    followStatus === "pending" && styles.followButtonMuted,
                    isFollowLoading && styles.disabledButton,
                  ]}
                  disabled={isFollowLoading}
                  onPress={
                    followStatus === "accepted" || followStatus === "pending"
                      ? unfollowOrCancelRequest
                      : followOrRequest
                  }
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      followStatus === "accepted" &&
                        styles.followButtonMutedText,
                      followStatus === "pending" &&
                        styles.followButtonMutedText,
                    ]}
                  >
                    {isFollowLoading ? "Working..." : followButtonLabel}
                  </Text>
                </Pressable>

                {followStatus === "pending" ? (
                  <Text style={styles.followHint}>
                    Your request is waiting for approval.
                  </Text>
                ) : null}

                {followMessage ? (
                  <Text style={styles.followMessage}>{followMessage}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.ownProfileHint}>This is your profile.</Text>
            )}
          </LinearGradient>

          {!canViewBlips ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>This profile is private.</Text>

              <Text style={styles.emptyText}>
                {followStatus === "pending"
                  ? "Your follow request is pending. If they approve it, their blips will appear here."
                  : "Send a follow request to see this profile’s blips if they approve you."}
              </Text>
            </View>
          ) : blips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No blips yet.</Text>

              <Text style={styles.emptyText}>
                This quiet corner is still waiting for its first blip.
              </Text>
            </View>
          ) : (
            <View style={styles.blipList}>
              {blips.map((blip) => (
                <LinearGradient
                  key={blip.id}
                  colors={profileGradient.colors}
                  start={profileGradient.start}
                  end={profileGradient.end}
                  style={styles.blipCard}
                >
                  <Text style={styles.blipDate}>
                    {formatDate(blip.created_at)}
                  </Text>
                  <Text style={styles.blipContent}>{blip.content}</Text>
                </LinearGradient>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientScreen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 40,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "300",
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    marginTop: 0,
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
  backButtonSmall: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "300",
  },
  profileCard: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 34,
    padding: 24,
    overflow: "hidden",
  },
  avatarCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  avatarImage: {
    resizeMode: "cover",
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "300",
  },
  username: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "500",
    marginTop: 16,
  },
  bio: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontWeight: "300",
    lineHeight: 23,
    marginTop: 8,
    textAlign: "center",
  },
  profileLink: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "300",
    marginTop: 14,
    textDecorationLine: "underline",
  },
  followArea: {
    alignItems: "center",
    marginTop: 18,
    width: "100%",
  },
  followButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  followButtonMuted: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  followButtonText: {
    color: "#642B73",
    fontSize: 14,
    fontWeight: "400",
  },
  followButtonMutedText: {
    color: "#ffffff",
    fontWeight: "300",
  },
  followHint: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 19,
    marginTop: 10,
    textAlign: "center",
  },
  followMessage: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 19,
    marginTop: 10,
    textAlign: "center",
  },
  ownProfileHint: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "300",
    marginTop: 14,
  },
  disabledButton: {
    opacity: 0.55,
  },
  blipList: {
    gap: 14,
    marginTop: 18,
  },
  blipCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 30,
    padding: 18,
    overflow: "hidden",
  },
  blipDate: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "300",
    marginBottom: 10,
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
    marginTop: 18,
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
});