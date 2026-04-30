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
import { useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useSwipeBack } from "../lib/use-swipe-back";

type SafetyProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

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

export default function MobileSafetyScreen() {
  const router = useRouter();
  const swipeBackPanHandlers = useSwipeBack(router);

  const [session, setSession] = useState<Session | null>(null);
  const [mutedProfiles, setMutedProfiles] = useState<SafetyProfile[]>([]);
  const [blockedProfiles, setBlockedProfiles] = useState<SafetyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workingProfileId, setWorkingProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function openProfile(username: string) {
    router.push({
      pathname: "/profile/[username]",
      params: { username },
    } as never);
  }

  async function loadSafetyLists() {
    setMessage("");

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);

    if (!currentSession?.user?.id) {
      setMutedProfiles([]);
      setBlockedProfiles([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const currentUserId = currentSession.user.id;

    const { data: muteData, error: muteError } = await supabase
      .from("mutes")
      .select("muted_id")
      .eq("muter_id", currentUserId);

    if (muteError) {
      console.error("Error loading muted profiles:", muteError);
      setMessage("Something went wrong loading muted profiles.");
      setMutedProfiles([]);
    }

    const { data: blockData, error: blockError } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", currentUserId);

    if (blockError) {
      console.error("Error loading blocked profiles:", blockError);
      setMessage("Something went wrong loading blocked profiles.");
      setBlockedProfiles([]);
    }

    const mutedIds = muteData?.map((item) => item.muted_id) ?? [];
    const blockedIds = blockData?.map((item) => item.blocked_id) ?? [];
    const allProfileIds = Array.from(new Set([...mutedIds, ...blockedIds]));

    if (allProfileIds.length === 0) {
      setMutedProfiles([]);
      setBlockedProfiles([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio")
      .in("id", allProfileIds);

    if (profileError) {
      console.error("Error loading muted/blocked profile details:", profileError);
      setMessage("Something went wrong loading profile details.");
      setMutedProfiles([]);
      setBlockedProfiles([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const profiles = (profileData ?? []) as SafetyProfile[];
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    setMutedProfiles(
      mutedIds
        .map((id) => profileById.get(id))
        .filter(Boolean) as SafetyProfile[]
    );

    setBlockedProfiles(
      blockedIds
        .map((id) => profileById.get(id))
        .filter(Boolean) as SafetyProfile[]
    );

    setIsLoading(false);
    setIsRefreshing(false);
  }

  async function refreshSafetyLists() {
    setIsRefreshing(true);
    await loadSafetyLists();
  }

  async function unmuteProfile(profileId: string) {
    if (!session?.user?.id) return;

    setWorkingProfileId(profileId);
    setMessage("");

    const { error } = await supabase
      .from("mutes")
      .delete()
      .eq("muter_id", session.user.id)
      .eq("muted_id", profileId);

    setWorkingProfileId(null);

    if (error) {
      console.error("Error unmuting profile from safety screen:", error);
      setMessage("Something went wrong unmuting this profile.");
      return;
    }

    setMutedProfiles((current) =>
      current.filter((profile) => profile.id !== profileId)
    );
    setMessage("Profile unmuted.");
  }

  async function unblockProfile(profileId: string) {
    if (!session?.user?.id) return;

    setWorkingProfileId(profileId);
    setMessage("");

    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", session.user.id)
      .eq("blocked_id", profileId);

    setWorkingProfileId(null);

    if (error) {
      console.error("Error unblocking profile from safety screen:", error);
      setMessage("Something went wrong unblocking this profile.");
      return;
    }

    setBlockedProfiles((current) =>
      current.filter((profile) => profile.id !== profileId)
    );
    setMessage("Profile unblocked.");
  }

  useEffect(() => {
    loadSafetyLists();
  }, []);

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
          <Text style={styles.loadingText}>Loading safety settings...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!session) {
    return (
      <LinearGradient
        colors={["#C6426E", "#642B73"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientScreen}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.loadingScreen}>
            <Text style={styles.emptyTitle}>You’re signed out.</Text>
            <Text style={styles.emptyText}>
              Sign in again to manage muted and blocked profiles.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/" as never)}
            >
              <Text style={styles.primaryButtonText}>Back to sign in</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#C6426E", "#642B73"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientScreen}
      {...swipeBackPanHandlers}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshSafetyLists}
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

            <Text style={styles.topTitle}>Safety</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.kicker}>Quietli</Text>
            <Text style={styles.title}>Muted and blocked profiles.</Text>

            <Text style={styles.bodyText}>
              Review the profiles you’ve muted or blocked. People are not
              notified when you mute, unmute, block, or unblock them.
            </Text>
          </View>

          {message ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Muted profiles</Text>

            {mutedProfiles.length === 0 ? (
              <Text style={styles.emptySectionText}>
                You haven’t muted anyone.
              </Text>
            ) : (
              <View style={styles.profileList}>
                {mutedProfiles.map((profile) => (
                  <View key={profile.id} style={styles.profileRow}>
                    <Pressable
                      style={styles.profileInfo}
                      onPress={() => openProfile(profile.username)}
                    >
                      <AvatarBubble
                        username={profile.username}
                        avatarUrl={profile.avatar_url}
                      />

                      <View style={styles.profileTextWrap}>
                        <Text style={styles.username}>@{profile.username}</Text>
                        <Text numberOfLines={2} style={styles.bio}>
                          {profile.bio || "A quiet little corner of Quietli."}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        workingProfileId === profile.id && styles.disabledButton,
                      ]}
                      disabled={workingProfileId === profile.id}
                      onPress={() => unmuteProfile(profile.id)}
                    >
                      <Text style={styles.actionButtonText}>
                        {workingProfileId === profile.id ? "Working..." : "Unmute"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Blocked profiles</Text>

            {blockedProfiles.length === 0 ? (
              <Text style={styles.emptySectionText}>
                You haven’t blocked anyone.
              </Text>
            ) : (
              <View style={styles.profileList}>
                {blockedProfiles.map((profile) => (
                  <View key={profile.id} style={styles.profileRow}>
                    <Pressable
                      style={styles.profileInfo}
                      onPress={() => openProfile(profile.username)}
                    >
                      <AvatarBubble
                        username={profile.username}
                        avatarUrl={profile.avatar_url}
                      />

                      <View style={styles.profileTextWrap}>
                        <Text style={styles.username}>@{profile.username}</Text>
                        <Text numberOfLines={2} style={styles.bio}>
                          {profile.bio || "A quiet little corner of Quietli."}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        workingProfileId === profile.id && styles.disabledButton,
                      ]}
                      disabled={workingProfileId === profile.id}
                      onPress={() => unblockProfile(profile.id)}
                    >
                      <Text style={styles.actionButtonText}>
                        {workingProfileId === profile.id
                          ? "Working..."
                          : "Unblock"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
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
  backButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "300",
  },
  heroCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 32,
    marginBottom: 18,
    padding: 22,
  },
  kicker: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "600",
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  bodyText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: "300",
    lineHeight: 25,
    marginTop: 12,
  },
  messageCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 24,
    marginBottom: 14,
    padding: 14,
  },
  messageText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 21,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30,
    marginBottom: 14,
    padding: 18,
  },
  sectionLabel: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "500",
    marginBottom: 12,
  },
  emptySectionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "300",
    lineHeight: 23,
  },
  profileList: {
    gap: 12,
  },
  profileRow: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 12,
  },
  profileInfo: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  profileTextWrap: {
    flex: 1,
  },
  username: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
  },
  bio: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 19,
    marginTop: 3,
  },
  actionButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: "#642B73",
    fontSize: 14,
    fontWeight: "400",
  },
  disabledButton: {
    opacity: 0.55,
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#642B73",
    fontSize: 14,
    fontWeight: "400",
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