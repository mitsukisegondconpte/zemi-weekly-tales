import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Novel {
  id: string;
  title: string;
  author: string;
  description: string | null;
  genre: string;
  cover_url: string | null;
  status: string;
  reactions: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  is_premium: boolean;
  coin_price: number;
  status: string;
  created_at: string;
}

export const usePublishedNovels = () =>
  useQuery({
    queryKey: ["novels", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Novel[];
    },
  });

export const useNovel = (id: string | undefined) =>
  useQuery({
    queryKey: ["novel", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Novel;
    },
  });

export const useChapters = (novelId: string | undefined) =>
  useQuery({
    queryKey: ["chapters", novelId],
    enabled: !!novelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", novelId!)
        .eq("status", "published")
        .order("chapter_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Chapter[];
    },
  });

export const useChapter = (chapterId: string | undefined) =>
  useQuery({
    queryKey: ["chapter", chapterId],
    enabled: !!chapterId,
    queryFn: async () => {
      // Use secure RPC that gates premium content behind unlock check
      const { data, error } = await supabase
        .rpc("get_chapter_content", { _chapter_id: chapterId! });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Chapter not found");
      return data[0] as Chapter;
    },
  });

export const useAdminNovels = () =>
  useQuery({
    queryKey: ["novels", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Novel[];
    },
  });

export const useAdminChapters = (novelId: string | undefined) =>
  useQuery({
    queryKey: ["chapters", "admin", novelId],
    enabled: !!novelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", novelId!)
        .order("chapter_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Chapter[];
    },
  });

export const GENRES = [
  "Romantik", "Dram", "Avanti", "Thriller", "Fanmi", "Fantezi",
  "Aksyon", "Komedi", "Orre", "Syans-Fiksyon"
] as const;
