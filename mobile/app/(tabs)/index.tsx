import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type AuthMode = "signin" | "signup";

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
};

function cleanUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export default function QuietliMobileHome() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setIsLoadingSession(false);

      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user?.id) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading mobile profile:", error);
      return;
    }

    setProfile(data);
  }

  async function signIn() {
    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("");
  }

  async function signUp() {
    setIsSubmitting(true);
    setMessage("");

    const finalUsername = cleanUsername(username);

    if (!finalUsername || finalUsername.length < 3) {
      setIsSubmitting(false);
      setMessage("Please choose a username with at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setIsSubmitting(false);
      setMessage("Please choose a password with at least 6 characters.");
      return;
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", finalUsername)
      .maybeSingle();

    if (existingProfile) {
      setIsSubmitting(false);
      setMessage("That username is already taken.");
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
      setMessage(error.message);
      return;
    }

    setMessage(
      "Almost there. Check your email for the Quietli confirmation link, then come back and sign in."
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setMessage("");
  }

  async function handleAuthSubmit() {
    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (authMode === "signin") {
      await signIn();
    } else {
      await signUp();
    }
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
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.signedInContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Quietli mobile</Text>

          <Text style={styles.title}>You’re signed in.</Text>

          <Text style={styles.bodyText}>
            This is the first native iPhone Quietli screen. Next we’ll build the
            real mobile feed, composer, Discover, and profile pages using the
            same Supabase backend as the website.
          </Text>

          <View style={styles.profilePreview}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(profile?.username || session.user.email || "q")
                  .slice(0, 1)
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName}>
                @{profile?.username || "quietli_user"}
              </Text>

              <Text style={styles.profileEmail}>{session.user.email}</Text>
            </View>
          </View>

          <Pressable style={styles.secondaryButton} onPress={signOut}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
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
                setMessage("");
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
                setMessage("");
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

          {message ? <Text style={styles.messageText}>{message}</Text> : null}
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
  signedInContent: {
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
  heroCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 32,
    padding: 24,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 18,
  },
  kicker: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: "uppercase",
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    marginTop: 24,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "400",
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
  profilePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    marginTop: 22,
    padding: 14,
  },
  avatarCircle: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "400",
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 13,
    fontWeight: "300",
    marginTop: 2,
  },
});