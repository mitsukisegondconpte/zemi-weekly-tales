import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AuthorApplication {
  id: string;
  user_id: string;
  bio: string;
  motivation: string;
  portfolio_url: string | null;
  status: "pending" | "accepted" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

/** Fetch the current user's roles to determine author status. */
export const useUserRoles = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_roles_full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });
};

export const useIsAuthor = () => {
  const { data: roles = [] } = useUserRoles();
  return roles.some((r) => r === "author" || r === "verified_author" || r === "admin");
};

export const useIsVerifiedAuthor = () => {
  const { data: roles = [] } = useUserRoles();
  return roles.some((r) => r === "verified_author" || r === "admin");
};

/** My author application (latest). */
export const useMyApplication = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("author_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as AuthorApplication | null;
    },
  });
};

/** Submit an author application via secure RPC. */
export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { bio: string; motivation: string; portfolio_url?: string }) => {
      const { data, error } = await supabase.rpc("submit_author_application", {
        _bio: payload.bio,
        _motivation: payload.motivation,
        _portfolio_url: payload.portfolio_url ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_application"] });
    },
  });
};

/** Notifications for the current user. */
export const useUserNotifications = (limit = 30) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_notifications", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as UserNotification[];
    },
  });
};

export const useUnreadCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_notifications_unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("user_notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user_notifications_unread"] });
    },
  });
};

export const useMarkAllRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user_notifications_unread"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("user_notifications").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_notifications"] });
      queryClient.invalidateQueries({ queryKey: ["user_notifications_unread"] });
    },
  });
};

/** Author's own novels. */
export const useMyNovels = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_novels", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("author_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

/** Author's chapters for a given novel (all statuses). */
export const useMyChapters = (novelId: string | undefined) => {
  return useQuery({
    queryKey: ["my_chapters", novelId],
    enabled: !!novelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", novelId!)
        .order("chapter_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};

/** Format a relative timestamp like "2h ago", "3d ago". */
export const formatRelative = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "kounye a";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}j`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mwa`;
  return `${Math.floor(mo / 12)}an`;
};
