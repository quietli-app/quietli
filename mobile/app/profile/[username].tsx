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
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [blips, setBlips] = useState<Blip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    if (!username) {
      setMessage("No profile username was provided.");
      setIsLoading(false);
      return;
    }

    setMessage("");

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

    setProfile(profileData as Profile);

    if (profileData.profile_visibility === "private") {
      setBlips([]);
      setIsLoading(false);
      return;
    }

    const { data: blipData, error: blipError } = await supabase
      .from("blips")
      .select("id, content, created_at")
      .eq("user_id", profileData.id)
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

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.emptyTitle}>Profile unavailable</Text>
        <Text style={styles.emptyText}>{message}</Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const profileColor = getProfileColor(profile.gradient_theme);
  const isPrivate = profile.profile_visibility === "private";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshProfile} />
      }
    >
      <View style={styles.topRow}>
        <Pressable style={styles.backButtonSmall} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.topTitle}>Quietli</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: profileColor }]}>
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
      </View>

      {isPrivate ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>This profile is private.</Text>

          <Text style={styles.emptyText}>
            Follow requests and private profile access will get a fuller native
            mobile flow soon.
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
            <View
              key={blip.id}
              style={[styles.blipCard, { backgroundColor: profileColor }]}
            >
              <Text style={styles.blipDate}>{formatDate(blip.created_at)}</Text>
              <Text style={styles.blipContent}>{blip.content}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#642B73",
  },
  content: {
    padding: 18,
    paddingBottom: 40,
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
  blipList: {
    gap: 14,
    marginTop: 18,
  },
  blipCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 30,
    padding: 18,
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