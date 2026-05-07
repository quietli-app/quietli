import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { getMobileGradientTheme } from "../../lib/mobile-gradient-themes";

type DiscoverProfile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  gradient_theme: string | null;
  profile_visibility: string | null;
};

function AvatarBubble({
  username,
  avatarUrl,
  size = 56,
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

export default function MobileExploreScreen() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const filteredProfiles = useMemo(() => {
    const cleanSearch = searchText.trim().toLowerCase();

    if (!cleanSearch) return profiles;

    return profiles.filter((profile) => {
      const username = profile.username?.toLowerCase() ?? "";
      const bio = profile.bio?.toLowerCase() ?? "";

      return username.includes(cleanSearch) || bio.includes(cleanSearch);
    });
  }, [profiles, searchText]);

  function openProfile(username: string) {
    router.push({
      pathname: "/profile/[username]",
      params: { username },
    } as never);
  }

  async function loadProfiles() {
    setMessage("");

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, gradient_theme, profile_visibility")
      .eq("profile_visibility", "public")
      .order("username", { ascending: true })
      .limit(75);

    if (error) {
      console.error("Error loading mobile discover profiles:", error);
      setMessage("Something went wrong loading Discover.");
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    const currentUserId = currentSession?.user?.id ?? null;

    const visibleProfiles = ((data ?? []) as DiscoverProfile[]).filter(
      (profile) => profile.id !== currentUserId && profile.username
    );

    setProfiles(visibleProfiles);
    setIsLoading(false);
  }

  async function refreshProfiles() {
    setIsRefreshing(true);
    await loadProfiles();
    setIsRefreshing(false);
  }

  useEffect(() => {
    loadProfiles();
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
          <Text style={styles.loadingText}>Opening Discover...</Text>
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
              Sign in again to discover quiet corners.
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
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshProfiles}
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

            <Text style={styles.topTitle}>Discover</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.kicker}>Quietli</Text>
            <Text style={styles.title}>Discover.</Text>

            <Text style={styles.bodyText}>
              Browse public quiet corners and find people whose blips feel like
              your kind of weird.
            </Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.cardLabel}>Search</Text>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Search usernames or bios..."
              placeholderTextColor="rgba(100, 43, 115, 0.45)"
              style={styles.searchInput}
            />
          </View>

          {message ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          {filteredProfiles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No profiles found.</Text>

              <Text style={styles.emptyText}>
                Quiet little Discover today. Try clearing the search or checking
                back later.
              </Text>
            </View>
          ) : (
            <View style={styles.profileList}>
              {filteredProfiles.map((profile) => {
                const username = profile.username ?? "quietli_user";
                const profileGradient = getMobileGradientTheme(
                  profile.gradient_theme
                );

                return (
                  <Pressable
                    key={profile.id}
                    onPress={() => openProfile(username)}
                  >
                    <LinearGradient
                      colors={profileGradient.colors}
                      start={profileGradient.start}
                      end={profileGradient.end}
                      style={styles.profileCard}
                    >
                      <AvatarBubble
                        username={username}
                        avatarUrl={profile.avatar_url}
                      />

                      <View style={styles.profileTextWrap}>
                        <Text style={styles.username}>@{username}</Text>

                        <Text numberOfLines={2} style={styles.bio}>
                          {profile.bio || "A quiet little corner of Quietli."}
                        </Text>
                      </View>

                      <Text style={styles.profileArrow}>›</Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
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
    fontSize: 36,
    fontWeight: "600",
    letterSpacing: -1.2,
    lineHeight: 40,
  },
  bodyText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: "300",
    lineHeight: 25,
    marginTop: 12,
  },
  searchCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30,
    marginBottom: 14,
    padding: 18,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "300",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  searchInput: {
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
  profileList: {
    gap: 14,
  },
  profileCard: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 30,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    overflow: "hidden",
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
  profileTextWrap: {
    flex: 1,
  },
  username: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "400",
  },
  bio: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 19,
    marginTop: 3,
  },
  profileArrow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 32,
    fontWeight: "200",
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
});