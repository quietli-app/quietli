import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  profile_visibility: string | null;
  plan: string | null;
};

const BIO_MAX_LENGTH = 160;

export default function MobileSettingsScreen() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);

      if (!currentSession?.user?.id) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, bio, profile_visibility, plan")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading mobile settings profile:", error);
        setMessage("Something went wrong loading your settings.");
      }

      const loadedProfile = (data ?? null) as Profile | null;

      setProfile(loadedProfile);
      setBio(loadedProfile?.bio ?? "");
      setIsLoading(false);
    }

    loadSettings();
  }, []);

  async function saveBio() {
    if (!session?.user?.id) {
      setMessage("Please sign in again to update your bio.");
      return;
    }

    const trimmedBio = bio.trim();

    if (trimmedBio.length > BIO_MAX_LENGTH) {
      setMessage(`Keep your bio under ${BIO_MAX_LENGTH} characters.`);
      return;
    }

    setIsSavingBio(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        bio: trimmedBio || null,
      })
      .eq("id", session.user.id);

    setIsSavingBio(false);

    if (error) {
      console.error("Error saving mobile bio:", error);
      setMessage("Something went wrong saving your bio.");
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            bio: trimmedBio || null,
          }
        : current
    );

    setBio(trimmedBio);
    setMessage("Bio saved.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/" as never);
  }

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.loadingText}>Opening settings...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.emptyTitle}>You’re signed out.</Text>
        <Text style={styles.emptyText}>
          Sign in again to manage your Quietli settings.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/" as never)}
        >
          <Text style={styles.primaryButtonText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  const charactersLeft = BIO_MAX_LENGTH - bio.length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButtonSmall} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.topTitle}>Settings</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Quietli</Text>
        <Text style={styles.title}>Account settings.</Text>

        <Text style={styles.bodyText}>
          Start with your bio. Keep it soft, simple, weird, mysterious, or
          completely normal. Quietli supports all vibes.
        </Text>
      </View>

      {message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.cardTitle}>{session.user.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Edit bio</Text>
        <Text style={styles.cardTitle}>@{profile?.username || "quietli_user"}</Text>

        <TextInput
          value={bio}
          onChangeText={(value) => {
            setBio(value.slice(0, BIO_MAX_LENGTH));
            setMessage("");
          }}
          multiline
          maxLength={BIO_MAX_LENGTH}
          placeholder="Write a tiny profile bio..."
          placeholderTextColor="rgba(100, 43, 115, 0.45)"
          style={styles.bioInput}
        />

        <View style={styles.bioFooter}>
          <Text style={styles.characterCount}>
            {charactersLeft} characters left
          </Text>

          <Pressable
            style={[styles.saveButton, isSavingBio && styles.disabledButton]}
            disabled={isSavingBio}
            onPress={saveBio}
          >
            <Text style={styles.saveButtonText}>
              {isSavingBio ? "Saving..." : "Save bio"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Profile</Text>

        <Text style={styles.cardText}>
          Visibility: {profile?.profile_visibility || "public"}
        </Text>

        <Text style={styles.cardText}>
          Plan: {profile?.plan === "plus" ? "Plus" : "Free"}
        </Text>

        {profile?.username ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/profile/[username]",
                params: { username: profile.username },
              } as never)
            }
          >
            <Text style={styles.secondaryButtonText}>View my profile</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Coming next</Text>
        <Text style={styles.cardText}>
          Next we’ll add profile visibility controls, profile links, theme
          picking, avatar upload, and account/data tools.
        </Text>
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.cardLabel}>Session</Text>
        <Text style={styles.cardTitle}>Sign out of Quietli</Text>

        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Sign out</Text>
        </Pressable>
      </View>
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
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30,
    marginBottom: 14,
    padding: 18,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 30,
    marginBottom: 14,
    padding: 18,
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
  cardLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "300",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "400",
    lineHeight: 28,
  },
  cardText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "300",
    lineHeight: 23,
    marginTop: 8,
  },
  bioInput: {
    minHeight: 110,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 22,
    color: "#642B73",
    fontSize: 16,
    fontWeight: "300",
    lineHeight: 23,
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    textAlignVertical: "top",
  },
  bioFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
  },
  characterCount: {
    color: "rgba(255,255,255,0.64)",
    flex: 1,
    fontSize: 13,
    fontWeight: "300",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: "#642B73",
    fontSize: 14,
    fontWeight: "400",
  },
  disabledButton: {
    opacity: 0.55,
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
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
  signOutButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  signOutButtonText: {
    color: "#642B73",
    fontSize: 14,
    fontWeight: "400",
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