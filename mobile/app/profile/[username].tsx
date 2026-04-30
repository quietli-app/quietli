import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
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
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMuteLoading, setIsMuteLoading] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [followMessage, setFollowMessage] = useState("");
  const [safetyMessage, setSafetyMessage] = useState("");

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

  async function loadSafetyStatus(currentUserId: string, targetUserId: string) {
    const { data: muteData, error: muteError } = await supabase
      .from("mutes")
      .select("muted_id")
      .eq("muter_id", currentUserId)
      .eq("muted_id", targetUserId)
      .maybeSingle();

    if (muteError) {
      console.error("Error loading mobile mute status:", muteError);
      setIsMuted(false);
    } else {
      setIsMuted(Boolean(muteData));
    }

    const { data: blockData, error: blockError } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", targetUserId)
      .maybeSingle();

    if (blockError) {
      console.error("Error loading mobile block status:", blockError);
      setIsBlocked(false);
    } else {
      setIsBlocked(Boolean(blockData));
    }
  }

  async function loadProfile() {
    if (!username) {
      setMessage("No profile username was provided.");
      setIsLoading(false);
      return;
    }

    setMessage("");
    setFollowMessage("");
    setSafetyMessage("");

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

      await loadSafetyStatus(currentUserId, typedProfile.id);
    } else {
      setFollowStatus("none");
      setIsMuted(false);
      setIsBlocked(false);
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

    if (!profile || isOwnProfile || isBlocked) return;

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

  async function muteProfile() {
    if (!session?.user?.id || !profile || isOwnProfile) return;

    setIsMuteLoading(true);
    setSafetyMessage("");

    const { error } = await supabase.from("mutes").upsert(
      {
        muter_id: session.user.id,
        muted_id: profile.id,
      },
      {
        onConflict: "muter_id,muted_id",
      }
    );

    setIsMuteLoading(false);

    if (error) {
      console.error("Error muting mobile profile:", error);
      setSafetyMessage("Something went wrong muting this profile.");
      return;
    }

    setIsMuted(true);
    setSafetyMessage(`@${profile.username} is now muted.`);
  }

  async function unmuteProfile() {
    if (!session?.user?.id || !profile || isOwnProfile) return;

    setIsMuteLoading(true);
    setSafetyMessage("");

    const { error } = await supabase
      .from("mutes")
      .delete()
      .eq("muter_id", session.user.id)
      .eq("muted_id", profile.id);

    setIsMuteLoading(false);

    if (error) {
      console.error("Error unmuting mobile profile:", error);
      setSafetyMessage("Something went wrong unmuting this profile.");
      return;
    }

    setIsMuted(false);
    setSafetyMessage(`@${profile.username} is no longer muted.`);
  }

  async function blockProfile() {
    if (!session?.user?.id || !profile || isOwnProfile) return;

    setIsBlockLoading(true);
    setSafetyMessage("");

    const { error: blockError } = await supabase.from("blocks").upsert(
      {
        blocker_id: session.user.id,
        blocked_id: profile.id,
      },
      {
        onConflict: "blocker_id,blocked_id",
      }
    );

    if (blockError) {
      console.error("Error blocking mobile profile:", blockError);
      setSafetyMessage("Something went wrong blocking this profile.");
      setIsBlockLoading(false);
      return;
    }

    await supabase
      .from("follows")
      .delete()
      .or(
        `and(follower_id.eq.${session.user.id},following_id.eq.${profile.id}),and(follower_id.eq.${profile.id},following_id.eq.${session.user.id})`
      );

    await supabase.from("mutes").upsert(
      {
        muter_id: session.user.id,
        muted_id: profile.id,
      },
      {
        onConflict: "muter_id,muted_id",
      }
    );

    setIsBlockLoading(false);
    setIsBlocked(true);
    setIsMuted(true);
    setFollowStatus("none");
    setBlips([]);
    setSafetyMessage(`@${profile.username} is now blocked.`);
  }

  async function unblockProfile() {
    if (!session?.user?.id || !profile || isOwnProfile) return;

    setIsBlockLoading(true);
    setSafetyMessage("");

    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", session.user.id)
      .eq("blocked_id", profile.id);

    setIsBlockLoading(false);

    if (error) {
      console.error("Error unblocking mobile profile:", error);
      setSafetyMessage("Something went wrong unblocking this profile.");
      return;
    }

    setIsBlocked(false);
    setSafetyMessage(`@${profile.username} is no longer blocked.`);
    await loadProfile();
  }

  async function handleMutePress() {
    if (isMuted) {
      await unmuteProfile();
    } else {
      await muteProfile();
    }
  }

  async function handleBlockPress() {
    if (isBlocked) {
      await unblockProfile();
    } else {
      await blockProfile();
    }
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
  const canViewBlips =
    !isBlocked && (!isPrivate || isOwnProfile || followStatus === "accepted");

  const followButtonLabel =
    followStatus === "accepted"
      ? "Unfollow"
      : followStatus === "pending"
        ? "Requested"
        : isPrivate
          ? "Request follow"
          : "Follow";

  return (
    <>
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
              {!isOwnProfile ? (
                <Pressable
                  style={styles.profileMenuButton}
                  onPress={() => setIsControlsOpen(true)}
                >
                  <Text style={styles.profileMenuButtonText}>•••</Text>
                </Pressable>
              ) : null}

              <AvatarBubble
                username={profile.username}
                avatarUrl={profile.avatar_url}
                size={90}
              />

              <Text style={styles.username}>@{profile.username}</Text>

              {profile.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}

              {profile.profile_link_label && profile.profile_link_url ? (
                <Text style={styles.profileLink}>
                  {profile.profile_link_label}
                </Text>
              ) : null}

              {isBlocked ? (
                <View style={styles.blockNotice}>
                  <Text style={styles.blockNoticeText}>
                    You have blocked this profile.
                  </Text>
                </View>
              ) : null}

              {!isOwnProfile && !isBlocked ? (
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
              ) : null}

              {isOwnProfile ? (
                <Text style={styles.ownProfileHint}>
                  This is your profile.
                </Text>
              ) : null}

              {safetyMessage ? (
                <Text style={styles.inlineSafetyMessage}>{safetyMessage}</Text>
              ) : null}
            </LinearGradient>

            {!canViewBlips ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {isBlocked ? "Profile blocked." : "This profile is private."}
                </Text>

                <Text style={styles.emptyText}>
                  {isBlocked
                    ? "Unblock this profile if you want to view or interact with it again."
                    : followStatus === "pending"
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

      <Modal visible={isControlsOpen} transparent animationType="fade">
        <Pressable
          style={styles.controlsOverlay}
          onPress={() => setIsControlsOpen(false)}
        >
          <Pressable style={styles.controlsCard}>
            <Text style={styles.controlsKicker}>Quietli</Text>
            <Text style={styles.controlsTitle}>Profile controls</Text>

            <Text style={styles.controlsText}>
              Mute hides this user from your feed. Block removes social
              connections and keeps this profile out of your Quietli space.
              {"\n\n"}
They will not be notified if you mute or block them.
            </Text>

            <Pressable
              style={[
                styles.controlsItem,
                isMuted && styles.controlsItemActive,
                isMuteLoading && styles.disabledButton,
              ]}
              disabled={isMuteLoading || isBlockLoading}
              onPress={handleMutePress}
            >
              <Text
                style={[
                  styles.controlsItemText,
                  isMuted && styles.controlsItemActiveText,
                ]}
              >
                {isMuteLoading ? "Working..." : isMuted ? "Unmute" : "Mute"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.controlsItem,
                isBlocked && styles.controlsItemActive,
                isBlockLoading && styles.disabledButton,
              ]}
              disabled={isMuteLoading || isBlockLoading}
              onPress={handleBlockPress}
            >
              <Text
                style={[
                  styles.controlsItemText,
                  isBlocked && styles.controlsItemActiveText,
                ]}
              >
                {isBlockLoading
                  ? "Working..."
                  : isBlocked
                    ? "Unblock"
                    : "Block"}
              </Text>
            </Pressable>

            {safetyMessage ? (
              <Text style={styles.controlsMessage}>{safetyMessage}</Text>
            ) : null}

            <Pressable
              style={styles.controlsClose}
              onPress={() => setIsControlsOpen(false)}
            >
              <Text style={styles.controlsCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  profileMenuButton: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 16,
    top: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    height: 36,
    width: 44,
    zIndex: 10,
  },
  profileMenuButtonText: {
  color: "#ffffff",
  fontSize: 18,
  fontWeight: "500",
  letterSpacing: 1,
  lineHeight: 18,
  textAlign: "center",
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
  blockNotice: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  blockNoticeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "300",
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
  inlineSafetyMessage: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 19,
    marginTop: 12,
    textAlign: "center",
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
  controlsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 5, 28, 0.55)",
    padding: 18,
  },
  controlsCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#642B73",
    borderRadius: 30,
    padding: 18,
  },
  controlsKicker: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "300",
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  controlsTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "500",
    marginBottom: 10,
  },
  controlsText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 21,
    marginBottom: 14,
  },
  controlsItem: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  controlsItemActive: {
    backgroundColor: "#ffffff",
  },
  controlsItemText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "300",
  },
  controlsItemActiveText: {
    color: "#642B73",
    fontWeight: "400",
  },
  controlsMessage: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 19,
    marginBottom: 12,
    marginTop: 2,
  },
  controlsClose: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    marginTop: 4,
    paddingVertical: 12,
  },
  controlsCloseText: {
    color: "#642B73",
    fontSize: 15,
    fontWeight: "400",
  },
});