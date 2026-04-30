import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type ProfileVisibility = "public" | "private";
type GradientTheme = "blush" | "violet" | "sky" | "mint" | "sunset";

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_visibility: ProfileVisibility | null;
  profile_link_label: string | null;
  profile_link_url: string | null;
  gradient_theme: GradientTheme | null;
  plan: string | null;
};

const BIO_MAX_LENGTH = 160;
const LINK_LABEL_MAX_LENGTH = 40;
const LINK_URL_MAX_LENGTH = 220;
const AVATAR_BUCKET = "avatars";

const themeOptions: {
  id: GradientTheme;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    id: "blush",
    label: "Blush",
    description: "Warm pink Quietli classic.",
    color: "#C6426E",
  },
  {
    id: "violet",
    label: "Violet",
    description: "Deep purple and cozy.",
    color: "#642B73",
  },
  {
    id: "sky",
    label: "Sky",
    description: "Soft blue and airy.",
    color: "#76D7EA",
  },
  {
    id: "mint",
    label: "Mint",
    description: "Fresh, calm, and green.",
    color: "#7DD8C5",
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Peachy, warm, and glowy.",
    color: "#F59E8B",
  },
];

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFileExtension(uri: string) {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  if (!extension || extension.length > 5) return "jpg";

  if (extension === "jpeg" || extension === "jpg") return "jpg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";

  return "jpg";
}

function getMimeType(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

function AvatarPreview({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null;
}) {
  return (
    <View style={styles.avatarPreview}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarPreviewImage} />
      ) : (
        <Text style={styles.avatarPreviewInitial}>
          {username.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export default function MobileSettingsScreen() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileVisibility, setProfileVisibility] =
    useState<ProfileVisibility>("public");

  const [profileLinkLabel, setProfileLinkLabel] = useState("");
  const [profileLinkUrl, setProfileLinkUrl] = useState("");
  const [gradientTheme, setGradientTheme] = useState<GradientTheme>("blush");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [isSavingProfileLink, setIsSavingProfileLink] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
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
        .select(
          "id, username, bio, avatar_url, profile_visibility, profile_link_label, profile_link_url, gradient_theme, plan"
        )
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading mobile settings profile:", error);
        setMessage("Something went wrong loading your settings.");
      }

      const loadedProfile = (data ?? null) as Profile | null;

      setProfile(loadedProfile);
      setBio(loadedProfile?.bio ?? "");
      setAvatarUrl(loadedProfile?.avatar_url ?? null);
      setProfileVisibility(
        loadedProfile?.profile_visibility === "private" ? "private" : "public"
      );
      setProfileLinkLabel(loadedProfile?.profile_link_label ?? "");
      setProfileLinkUrl(loadedProfile?.profile_link_url ?? "");
      setGradientTheme(loadedProfile?.gradient_theme ?? "blush");
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

  async function chooseAndUploadAvatar() {
    if (!session?.user?.id) {
      setMessage("Please sign in again to update your profile photo.");
      return;
    }

    setMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage("Quietli needs photo library access to choose an avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const imageUri = result.assets[0].uri;
    const extension = getFileExtension(imageUri);
    const mimeType = getMimeType(extension);
    const filePath = `${session.user.id}/avatar-${Date.now()}.${extension}`;

    setIsSavingAvatar(true);
    setMessage("");

    try {
      const response = await fetch(imageUri);
      const imageBlob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, imageBlob, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading mobile avatar:", uploadError);
        setMessage(
          "Something went wrong uploading your avatar. Check your Supabase avatar storage bucket and policies."
        );
        setIsSavingAvatar(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("id", session.user.id);

      if (profileError) {
        console.error("Error saving mobile avatar URL:", profileError);
        setMessage("The photo uploaded, but Quietli could not save it to your profile.");
        setIsSavingAvatar(false);
        return;
      }

      setAvatarUrl(publicUrl);
      setProfile((current) =>
        current
          ? {
              ...current,
              avatar_url: publicUrl,
            }
          : current
      );

      setMessage("Profile photo saved.");
    } catch (error) {
      console.error("Unexpected mobile avatar upload error:", error);
      setMessage("Something unexpected went wrong uploading your avatar.");
    }

    setIsSavingAvatar(false);
  }

  async function removeAvatar() {
    if (!session?.user?.id) {
      setMessage("Please sign in again to remove your profile photo.");
      return;
    }

    setIsSavingAvatar(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
      })
      .eq("id", session.user.id);

    setIsSavingAvatar(false);

    if (error) {
      console.error("Error removing mobile avatar:", error);
      setMessage("Something went wrong removing your profile photo.");
      return;
    }

    setAvatarUrl(null);
    setProfile((current) =>
      current
        ? {
            ...current,
            avatar_url: null,
          }
        : current
    );

    setMessage("Profile photo removed.");
  }

  async function saveVisibility(nextVisibility: ProfileVisibility) {
    if (!session?.user?.id) {
      setMessage("Please sign in again to update your profile visibility.");
      return;
    }

    if (nextVisibility === profileVisibility) return;

    setIsSavingVisibility(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        profile_visibility: nextVisibility,
      })
      .eq("id", session.user.id);

    setIsSavingVisibility(false);

    if (error) {
      console.error("Error saving mobile profile visibility:", error);
      setMessage("Something went wrong saving your profile visibility.");
      return;
    }

    setProfileVisibility(nextVisibility);

    setProfile((current) =>
      current
        ? {
            ...current,
            profile_visibility: nextVisibility,
          }
        : current
    );

    setMessage(
      nextVisibility === "private"
        ? "Your profile is now private. New followers will need approval."
        : "Your profile is now public."
    );
  }

  async function saveProfileLink() {
    if (!session?.user?.id) {
      setMessage("Please sign in again to update your profile link.");
      return;
    }

    const trimmedLabel = profileLinkLabel.trim();
    const normalizedUrl = normalizeUrl(profileLinkUrl);

    if (trimmedLabel.length > LINK_LABEL_MAX_LENGTH) {
      setMessage(
        `Keep your link label under ${LINK_LABEL_MAX_LENGTH} characters.`
      );
      return;
    }

    if (normalizedUrl.length > LINK_URL_MAX_LENGTH) {
      setMessage(`Keep your link URL under ${LINK_URL_MAX_LENGTH} characters.`);
      return;
    }

    if ((trimmedLabel && !normalizedUrl) || (!trimmedLabel && normalizedUrl)) {
      setMessage("Please include both a link label and a URL, or clear both.");
      return;
    }

    if (!isValidUrl(normalizedUrl)) {
      setMessage("Please enter a valid URL, like https://example.com.");
      return;
    }

    setIsSavingProfileLink(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        profile_link_label: trimmedLabel || null,
        profile_link_url: normalizedUrl || null,
      })
      .eq("id", session.user.id);

    setIsSavingProfileLink(false);

    if (error) {
      console.error("Error saving mobile profile link:", error);
      setMessage("Something went wrong saving your profile link.");
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            profile_link_label: trimmedLabel || null,
            profile_link_url: normalizedUrl || null,
          }
        : current
    );

    setProfileLinkLabel(trimmedLabel);
    setProfileLinkUrl(normalizedUrl);
    setMessage(trimmedLabel ? "Profile link saved." : "Profile link cleared.");
  }

  async function saveTheme(nextTheme: GradientTheme) {
    if (!session?.user?.id) {
      setMessage("Please sign in again to update your theme.");
      return;
    }

    setGradientTheme(nextTheme);
    setIsSavingTheme(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        gradient_theme: nextTheme,
      })
      .eq("id", session.user.id);

    setIsSavingTheme(false);

    if (error) {
      console.error("Error saving mobile theme:", error);
      setMessage("Something went wrong saving your theme.");
      return;
    }

    const selectedTheme = themeOptions.find((theme) => theme.id === nextTheme);

    setProfile((current) =>
      current
        ? {
            ...current,
            gradient_theme: nextTheme,
          }
        : current
    );

    setMessage(`${selectedTheme?.label ?? "Theme"} theme saved.`);
  }

  function clearProfileLinkFields() {
    setProfileLinkLabel("");
    setProfileLinkUrl("");
    setMessage("");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/" as never);
  }

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
          <Text style={styles.loadingText}>Opening settings...</Text>
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
              Sign in again to manage your Quietli settings.
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

  const charactersLeft = BIO_MAX_LENGTH - bio.length;
  const linkLabelCharactersLeft = LINK_LABEL_MAX_LENGTH - profileLinkLabel.length;
  const linkUrlCharactersLeft = LINK_URL_MAX_LENGTH - profileLinkUrl.length;
  const isPrivate = profileVisibility === "private";
  const activeTheme =
    themeOptions.find((theme) => theme.id === gradientTheme) ?? themeOptions[0];
  const displayUsername = profile?.username || "quietli_user";

  return (
    <LinearGradient
      colors={["#C6426E", "#642B73"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientScreen}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <Pressable
              style={styles.backButtonSmall}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <Text style={styles.topTitle}>Settings</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.kicker}>Quietli</Text>
            <Text style={styles.title}>Account settings.</Text>

            <Text style={styles.bodyText}>
              Edit your bio, profile photo, visibility, link, and theme.
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
            <Text style={styles.cardLabel}>Profile photo</Text>
            <Text style={styles.cardTitle}>@{displayUsername}</Text>

            <View style={styles.avatarRow}>
              <AvatarPreview username={displayUsername} avatarUrl={avatarUrl} />

              <View style={styles.avatarTextWrap}>
                <Text style={styles.cardText}>
                  Choose a square-ish photo from your iPhone library.
                </Text>

                <Text style={styles.inputHint}>
                  Your avatar will update across your profile, feed, and Discover.
                </Text>
              </View>
            </View>

            <View style={styles.linkButtonRow}>
              <Pressable
                style={[styles.saveButton, isSavingAvatar && styles.disabledButton]}
                disabled={isSavingAvatar}
                onPress={chooseAndUploadAvatar}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingAvatar ? "Saving..." : "Choose photo"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.clearButton}
                disabled={isSavingAvatar}
                onPress={removeAvatar}
              >
                <Text style={styles.clearButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Edit bio</Text>
            <Text style={styles.cardTitle}>@{displayUsername}</Text>

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
            <Text style={styles.cardLabel}>Profile visibility</Text>
            <Text style={styles.cardTitle}>
              {isPrivate ? "Private profile" : "Public profile"}
            </Text>

            <Text style={styles.cardText}>
              {isPrivate
                ? "Your blips are hidden from public view. New followers will need to send a request before they can see your private profile."
                : "Your profile and public blips can appear in World View and Discover."}
            </Text>

            <View style={styles.visibilityToggle}>
              <Pressable
                style={[
                  styles.visibilityOption,
                  !isPrivate && styles.visibilityOptionActive,
                ]}
                disabled={isSavingVisibility}
                onPress={() => saveVisibility("public")}
              >
                <Text
                  style={[
                    styles.visibilityOptionText,
                    !isPrivate && styles.visibilityOptionTextActive,
                  ]}
                >
                  Public
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.visibilityOption,
                  isPrivate && styles.visibilityOptionActive,
                ]}
                disabled={isSavingVisibility}
                onPress={() => saveVisibility("private")}
              >
                <Text
                  style={[
                    styles.visibilityOptionText,
                    isPrivate && styles.visibilityOptionTextActive,
                  ]}
                >
                  Private
                </Text>
              </Pressable>
            </View>

            {isSavingVisibility ? (
              <Text style={styles.savingText}>Saving visibility...</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Profile link</Text>
            <Text style={styles.cardTitle}>Add one link</Text>

            <Text style={styles.cardText}>
              Free profiles can have one link. Later, Quietli Plus can expand
              this into multiple links and richer profile extras.
            </Text>

            <Text style={styles.inputLabel}>Link label</Text>
            <TextInput
              value={profileLinkLabel}
              onChangeText={(value) => {
                setProfileLinkLabel(value.slice(0, LINK_LABEL_MAX_LENGTH));
                setMessage("");
              }}
              maxLength={LINK_LABEL_MAX_LENGTH}
              placeholder="My website"
              placeholderTextColor="rgba(100, 43, 115, 0.45)"
              style={styles.textInput}
            />

            <Text style={styles.inputHint}>
              {linkLabelCharactersLeft} label characters left
            </Text>

            <Text style={styles.inputLabel}>Link URL</Text>
            <TextInput
              value={profileLinkUrl}
              onChangeText={(value) => {
                setProfileLinkUrl(value.slice(0, LINK_URL_MAX_LENGTH));
                setMessage("");
              }}
              maxLength={LINK_URL_MAX_LENGTH}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://example.com"
              placeholderTextColor="rgba(100, 43, 115, 0.45)"
              style={styles.textInput}
            />

            <Text style={styles.inputHint}>
              {linkUrlCharactersLeft} URL characters left
            </Text>

            <View style={styles.linkButtonRow}>
              <Pressable
                style={[
                  styles.saveButton,
                  isSavingProfileLink && styles.disabledButton,
                ]}
                disabled={isSavingProfileLink}
                onPress={saveProfileLink}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingProfileLink ? "Saving..." : "Save link"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.clearButton}
                disabled={isSavingProfileLink}
                onPress={clearProfileLinkFields}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Theme</Text>
            <Text style={styles.cardTitle}>{activeTheme.label}</Text>

            <Text style={styles.cardText}>
              Pick the color mood for your profile and blip cards.
            </Text>

            <View
              style={[
                styles.themePreview,
                {
                  backgroundColor: activeTheme.color,
                },
              ]}
            >
              <Text style={styles.themePreviewText}>@{displayUsername}</Text>

              <Text style={styles.themePreviewSubtext}>
                This is how your quiet corner feels.
              </Text>
            </View>

            <View style={styles.themeGrid}>
              {themeOptions.map((theme) => {
                const isActive = theme.id === gradientTheme;

                return (
                  <Pressable
                    key={theme.id}
                    style={[
                      styles.themeOption,
                      isActive && styles.themeOptionActive,
                    ]}
                    disabled={isSavingTheme}
                    onPress={() => saveTheme(theme.id)}
                  >
                    <View
                      style={[
                        styles.themeSwatch,
                        {
                          backgroundColor: theme.color,
                        },
                      ]}
                    />

                    <View style={styles.themeTextWrap}>
                      <Text
                        style={[
                          styles.themeLabel,
                          isActive && styles.themeLabelActive,
                        ]}
                      >
                        {theme.label}
                      </Text>

                      <Text style={styles.themeDescription}>
                        {theme.description}
                      </Text>
                    </View>

                    {isActive ? (
                      <Text style={styles.themeActiveText}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {isSavingTheme ? (
              <Text style={styles.savingText}>Saving theme...</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Profile</Text>

            <Text style={styles.cardText}>
              Visibility: {profileVisibility || "public"}
            </Text>

            <Text style={styles.cardText}>
              Plan: {profile?.plan === "plus" ? "Plus" : "Free"}
            </Text>

            {profile?.profile_link_label && profile?.profile_link_url ? (
              <Text style={styles.cardText}>
                Link: {profile.profile_link_label}
              </Text>
            ) : (
              <Text style={styles.cardText}>Link: none</Text>
            )}

            <Text style={styles.cardText}>Theme: {activeTheme.label}</Text>

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

          <View style={styles.dangerCard}>
            <Text style={styles.cardLabel}>Session</Text>
            <Text style={styles.cardTitle}>Sign out of Quietli</Text>

            <Pressable style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
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
  avatarRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },
  avatarPreview: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 42,
    height: 84,
    overflow: "hidden",
    width: 84,
  },
  avatarPreviewImage: {
    borderRadius: 42,
    height: 84,
    resizeMode: "cover",
    width: 84,
  },
  avatarPreviewInitial: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "300",
  },
  avatarTextWrap: {
    flex: 1,
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
  textInput: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 18,
    color: "#642B73",
    fontSize: 16,
    fontWeight: "300",
    marginTop: 8,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "300",
    marginTop: 16,
  },
  inputHint: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 6,
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
  clearButton: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "300",
  },
  linkButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  visibilityToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 16,
    padding: 4,
  },
  visibilityOption: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  visibilityOptionActive: {
    backgroundColor: "#ffffff",
  },
  visibilityOptionText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "300",
  },
  visibilityOptionTextActive: {
    color: "#642B73",
    fontWeight: "400",
  },
  themePreview: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 26,
    marginTop: 16,
    padding: 18,
  },
  themePreviewText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "400",
  },
  themePreviewSubtext: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 21,
    marginTop: 6,
  },
  themeGrid: {
    gap: 10,
    marginTop: 16,
  },
  themeOption: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 22,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  themeOptionActive: {
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  themeSwatch: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  themeTextWrap: {
    flex: 1,
  },
  themeLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    fontWeight: "300",
  },
  themeLabelActive: {
    color: "#ffffff",
    fontWeight: "500",
  },
  themeDescription: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "300",
    lineHeight: 17,
    marginTop: 2,
  },
  themeActiveText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
  savingText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "300",
    marginTop: 10,
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