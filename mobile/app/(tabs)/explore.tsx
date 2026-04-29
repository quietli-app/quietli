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
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

type DiscoverProfile = {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  gradient_theme: string | null;
  profile_visibility: string | null;
};

const themeBackgrounds: Record<string, string> = {
  blush: "#C6426E",
  violet: "#642B73",
  sky: "#76D7EA",
  mint: "#7DD8C5",
  sunset: "#F59E8B",
};

function getProfileColor(theme?: string | null) {
  if (!theme) return themeBackgrounds.blush;
  return themeBackgrounds[theme] ?? themeBackgrounds.blush;
}

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

export default function MobileDiscoverScreen() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  function openProfile(username: string) {
    router.push({
      pathname: "/profile/[username]",
      params: { username },
    } as never);
  }

  async function loadProfiles() {
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, bio, avatar_url, gradient_theme, profile_visibility"
      )
      .eq("profile_visibility", "public")
      .not("username", "is", null)
      .order("username", { ascending: true })
      .limit(80);

    if (error) {
      console.error("Error loading mobile discover profiles:", error);
      setMessage("Something went wrong loading Discover.");
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    setProfiles((data ?? []) as DiscoverProfile[]);
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
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.loadingText}>Opening Discover...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshProfiles} />
      }
    >
      <View style={styles.topRow}>
        <Pressable style={styles.backButtonSmall} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.topTitle}>Discover</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Quietli</Text>
        <Text style={styles.title}>Find quiet corners.</Text>

        <Text style={styles.bodyText}>
          Browse public profiles and discover small thoughts drifting through
          Quietli.
        </Text>
      </View>

      {message ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Could not load Discover.</Text>
          <Text style={styles.emptyText}>{message}</Text>
        </View>
      ) : profiles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No public profiles yet.</Text>
          <Text style={styles.emptyText}>
            Quiet out here. Public profiles will appear here as people join.
          </Text>
        </View>
      ) : (
        <View style={styles.profileList}>
          {profiles.map((profile) => (
            <Pressable
              key={profile.id}
              style={[
                styles.profileCard,
                { backgroundColor: getProfileColor(profile.gradient_theme) },
              ]}
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

              <Text style={styles.visitText}>View</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: 18,
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
    marginTop: 12,
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
  visitText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "300",
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
});