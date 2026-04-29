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
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type RawFollowRequest = {
  id: string;
  follower_id: string;
  following_id: string;
  status: string;
  created_at: string | null;
};

type RequesterProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  gradient_theme: string | null;
};

type RequestItem = {
  id: string;
  followerId: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Recently";

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

export default function MobileFollowRequestsScreen() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workingRequestId, setWorkingRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function openProfile(username: string) {
    router.push({
      pathname: "/profile/[username]",
      params: { username },
    } as never);
  }

  async function loadRequests() {
    setMessage("");

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);

    if (!currentSession?.user?.id) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const { data: followData, error: followError } = await supabase
      .from("follows")
      .select("id, follower_id, following_id, status, created_at")
      .eq("following_id", currentSession.user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (followError) {
      console.error("Error loading mobile follow requests:", followError);
      setMessage("Something went wrong loading follow requests.");
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const rawRequests = (followData ?? []) as RawFollowRequest[];
    const followerIds = rawRequests.map((request) => request.follower_id);

    if (followerIds.length === 0) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, gradient_theme")
      .in("id", followerIds);

    if (profileError) {
      console.error("Error loading requester profiles:", profileError);
      setMessage("Something went wrong loading requester profiles.");
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const profiles = (profileData ?? []) as RequesterProfile[];
    const profileById = new Map(
      profiles.map((profile) => [profile.id, profile])
    );

    const formattedRequests = rawRequests.map((request) => {
      const requesterProfile = profileById.get(request.follower_id);

      return {
        id: request.id,
        followerId: request.follower_id,
        username: requesterProfile?.username ?? "unknown",
        avatarUrl: requesterProfile?.avatar_url ?? null,
        bio: requesterProfile?.bio ?? null,
        createdAt: request.created_at,
      };
    });

    setRequests(formattedRequests);
    setIsLoading(false);
  }

  async function refreshRequests() {
    setIsRefreshing(true);
    await loadRequests();
    setIsRefreshing(false);
  }

  async function approveRequest(requestId: string) {
    setWorkingRequestId(requestId);
    setMessage("");

    const { error } = await supabase
      .from("follows")
      .update({ status: "accepted" })
      .eq("id", requestId);

    setWorkingRequestId(null);

    if (error) {
      console.error("Error approving follow request:", error);
      setMessage("Could not approve this follow request.");
      return;
    }

    setRequests((current) =>
      current.filter((request) => request.id !== requestId)
    );
  }

  async function denyRequest(requestId: string) {
    setWorkingRequestId(requestId);
    setMessage("");

    const { error } = await supabase.from("follows").delete().eq("id", requestId);

    setWorkingRequestId(null);

    if (error) {
      console.error("Error denying follow request:", error);
      setMessage("Could not deny this follow request.");
      return;
    }

    setRequests((current) =>
      current.filter((request) => request.id !== requestId)
    );
  }

  useEffect(() => {
    loadRequests();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.loadingText}>Loading follow requests...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.emptyTitle}>You’re signed out.</Text>
        <Text style={styles.emptyText}>
          Sign in again to review follow requests.
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshRequests} />
      }
    >
      <View style={styles.topRow}>
        <Pressable style={styles.backButtonSmall} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.topTitle}>Requests</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Quietli</Text>
        <Text style={styles.title}>Follow requests.</Text>

        <Text style={styles.bodyText}>
          Approve or deny requests from people who want to follow your private
          profile.
        </Text>
      </View>

      {message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No follow requests.</Text>
          <Text style={styles.emptyText}>
            Nothing waiting right now. Quiet little inbox, very on-brand.
          </Text>
        </View>
      ) : (
        <View style={styles.requestList}>
          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <Pressable
                style={styles.requestProfile}
                onPress={() => openProfile(request.username)}
              >
                <AvatarBubble
                  username={request.username}
                  avatarUrl={request.avatarUrl}
                />

                <View style={styles.requestTextWrap}>
                  <Text style={styles.username}>@{request.username}</Text>

                  <Text numberOfLines={2} style={styles.bio}>
                    {request.bio || "A quiet little corner of Quietli."}
                  </Text>

                  <Text style={styles.dateText}>
                    Requested {formatDate(request.createdAt)}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.approveButton,
                    workingRequestId === request.id && styles.disabledButton,
                  ]}
                  disabled={workingRequestId === request.id}
                  onPress={() => approveRequest(request.id)}
                >
                  <Text style={styles.approveButtonText}>
                    {workingRequestId === request.id ? "Working..." : "Approve"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.denyButton,
                    workingRequestId === request.id && styles.disabledButton,
                  ]}
                  disabled={workingRequestId === request.id}
                  onPress={() => denyRequest(request.id)}
                >
                  <Text style={styles.denyButtonText}>
                    {workingRequestId === request.id ? "Working..." : "Deny"}
                  </Text>
                </Pressable>
              </View>
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
  requestList: {
    gap: 14,
  },
  requestCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 30,
    padding: 16,
  },
  requestProfile: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
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
  requestTextWrap: {
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
  dateText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 5,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  approveButton: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 11,
  },
  approveButtonText: {
    color: "#642B73",
    fontSize: 14,
    fontWeight: "400",
  },
  denyButton: {
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingVertical: 11,
  },
  denyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "300",
  },
  disabledButton: {
    opacity: 0.55,
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