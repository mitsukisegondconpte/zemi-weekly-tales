import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  saveChapterOffline,
  saveNovelOffline,
  getDownloadedChaptersForNovel,
  deleteChapterOffline,
  deleteNovelOffline,
  getAllDownloadedNovels,
  type OfflineNovel,
} from "@/lib/offlineStore";
import { toast } from "sonner";

export const useOnlineStatus = () => {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
};

export const useDownloadedChapters = (novelId: string | undefined) => {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const refresh = useCallback(async () => {
    if (!novelId) return;
    const list = await getDownloadedChaptersForNovel(novelId);
    setIds(new Set(list.map(c => c.id)));
  }, [novelId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { ids, refresh };
};

export const useDownloadedNovels = () => {
  const [novels, setNovels] = useState<OfflineNovel[]>([]);
  const refresh = useCallback(async () => {
    setNovels(await getAllDownloadedNovels());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { novels, refresh };
};

/**
 * Download a single chapter. Uses the secure RPC so premium content is gated by unlock.
 */
export const downloadChapter = async (chapterId: string) => {
  const { data, error } = await supabase.rpc("get_chapter_content", { _chapter_id: chapterId });
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Chapter not found");
  const ch = data[0];
  await saveChapterOffline({
    id: ch.id,
    novel_id: ch.novel_id,
    title: ch.title,
    content: ch.content,
    chapter_number: ch.chapter_number,
    is_premium: ch.is_premium,
    coin_price: ch.coin_price,
    status: ch.status,
    created_at: ch.created_at,
  });
};

export const downloadNovelMeta = async (novelId: string) => {
  const { data, error } = await supabase.from("novels").select("*").eq("id", novelId).single();
  if (error) throw error;
  await saveNovelOffline({
    id: data.id,
    title: data.title,
    author: data.author,
    cover_url: data.cover_url,
    description: data.description,
    genre: data.genre,
  });
};

/**
 * Download a list of chapters with progress toast.
 * Skips premium chapters that the user hasn't unlocked (RPC will reject them).
 */
export const downloadChapters = async (
  novelId: string,
  chapterIds: string[],
  onProgress?: (done: number, total: number) => void
) => {
  await downloadNovelMeta(novelId);
  let done = 0;
  let skipped = 0;
  for (const id of chapterIds) {
    try {
      await downloadChapter(id);
    } catch {
      skipped++;
    }
    done++;
    onProgress?.(done, chapterIds.length);
  }
  return { done: done - skipped, skipped };
};

export const removeChapterDownload = async (id: string) => {
  await deleteChapterOffline(id);
};

export const removeNovelDownload = async (novelId: string) => {
  await deleteNovelOffline(novelId);
  toast.success("Telechajman efase");
};
