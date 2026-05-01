import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ============= AUTHOR STATS =============
export const useAuthorStats = (authorId: string | undefined) => {
  return useQuery({
    queryKey: ["author_stats", authorId],
    enabled: !!authorId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_author_stats", { _author_id: authorId! });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
};

// ============= ADMIN OVERVIEW =============
export const useAdminOverview = () => {
  return useQuery({
    queryKey: ["admin_overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_overview");
      if (error) throw error;
      return data?.[0] ?? null;
    },
    refetchInterval: 30_000,
  });
};

// ============= CONTINUE READING =============
export const useContinueReading = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["continue_reading", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: cont, error } = await supabase.rpc("get_continue_reading", {
        _user_id: user!.id,
        _limit: 8,
      });
      if (error) throw error;
      const list = (cont ?? []) as any[];
      if (list.length === 0) return [];
      const novelIds = list.map((x) => x.novel_id);
      const { data: novels } = await supabase
        .from("novels")
        .select("id, title, cover_url, author, genre")
        .in("id", novelIds);
      const novelMap = new Map((novels ?? []).map((n) => [n.id, n]));
      return list
        .map((x) => ({
          ...x,
          novel: novelMap.get(x.novel_id),
        }))
        .filter((x) => x.novel);
    },
  });
};

// ============= CHAPTER PROGRESS =============
export const saveChapterProgress = async (
  userId: string,
  novelId: string,
  chapterId: string,
  scrollPct: number
) => {
  await supabase
    .from("chapter_progress")
    .upsert(
      {
        user_id: userId,
        novel_id: novelId,
        chapter_id: chapterId,
        scroll_pct: Math.min(100, Math.max(0, Math.round(scrollPct))),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,chapter_id" }
    );
};

export const useChapterProgress = (chapterId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chapter_progress", chapterId, user?.id],
    enabled: !!user && !!chapterId,
    queryFn: async () => {
      const { data } = await supabase
        .from("chapter_progress")
        .select("scroll_pct")
        .eq("user_id", user!.id)
        .eq("chapter_id", chapterId!)
        .maybeSingle();
      return data?.scroll_pct ?? 0;
    },
  });
};

// ============= COMMENT LIKES =============
export const useCommentLikes = (commentIds: string[]) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comment_likes", commentIds.sort().join(","), user?.id],
    enabled: commentIds.length > 0,
    queryFn: async () => {
      const { data: all } = await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (all ?? []).forEach((l) => {
        counts[l.comment_id] = (counts[l.comment_id] || 0) + 1;
        if (user && l.user_id === user.id) mine.add(l.comment_id);
      });
      return { counts, mine };
    },
  });
};

export const useToggleCommentLike = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, liked }: { commentId: string; liked: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (liked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comment_likes"] }),
  });
};

// ============= REALTIME NOTIFICATIONS =============
export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n: any = payload.new;
          qc.invalidateQueries({ queryKey: ["user_notifications"] });
          qc.invalidateQueries({ queryKey: ["user_notifications_unread"] });
          toast(n.title || "Nouvo notifikasyon", {
            description: n.message,
            action: n.link
              ? { label: "Wè", onClick: () => navigate(n.link) }
              : undefined,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc, navigate]);
};
