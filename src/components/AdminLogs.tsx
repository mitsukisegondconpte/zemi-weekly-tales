import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, Clock, ShieldCheck, ShieldX, UserCheck, UserX, Bell, Ban, AlertTriangle } from "lucide-react";
import { formatRelative } from "@/hooks/useAuthor";

const ACTION_META: Record<string, { label: string; icon: any; cls: string }> = {
  chapter_approved: { label: "Chapit apwouve", icon: ShieldCheck, cls: "bg-green-500/10 text-green-600 dark:text-green-400" },
  chapter_rejected: { label: "Chapit refize", icon: ShieldX, cls: "bg-destructive/10 text-destructive" },
  application_accepted: { label: "Aplikasyon aksepte", icon: UserCheck, cls: "bg-green-500/10 text-green-600 dark:text-green-400" },
  application_rejected: { label: "Aplikasyon refize", icon: UserX, cls: "bg-destructive/10 text-destructive" },
  warn_author: { label: "Avètisman bay otè", icon: Bell, cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  novel_disqualified: { label: "Novèl diskalifye", icon: Ban, cls: "bg-destructive/10 text-destructive" },
};

const AdminLogs = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin_logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      const list = (data ?? []) as any[];
      const adminIds = Array.from(new Set(list.map((l) => l.admin_id)));
      const { data: profs } = adminIds.length
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", adminIds)
        : { data: [] as any[] };
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.display_name]));
      return list.map((l) => ({ ...l, admin_name: map.get(l.admin_id) ?? "Admin" }));
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold font-serif text-foreground flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-primary" />
        Jounal aksyon admin ({logs.length})
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Pa gen okenn aksyon ankò.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l: any) => {
            const meta = ACTION_META[l.action] ?? { label: l.action, icon: AlertTriangle, cls: "bg-secondary text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <div key={l.id} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{meta.label}</p>
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatRelative(l.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pa <span className="font-medium text-foreground">{l.admin_name}</span>
                    {l.target_label && <> · Sib: <span className="font-medium text-foreground break-all">{l.target_label}</span></>}
                  </p>
                  {l.reason && (
                    <p className="text-xs text-foreground mt-1 break-words">
                      <span className="font-semibold">Rezon:</span> {l.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
