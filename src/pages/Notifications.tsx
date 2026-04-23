import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2, MailCheck, Sparkles, MessageSquare, FileCheck, AlertCircle } from "lucide-react";
import {
  useUserNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  useDeleteNotification,
  formatRelative,
  type UserNotification,
} from "@/hooks/useAuthor";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

const typeIcon = (type: string) => {
  switch (type) {
    case "application_decision":
      return Sparkles;
    case "chapter_moderation":
      return FileCheck;
    case "comment":
      return MessageSquare;
    case "system":
      return AlertCircle;
    default:
      return Bell;
  }
};

const NotificationCard = ({
  n,
  onRead,
  onDelete,
  index,
}: {
  n: UserNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}) => {
  const Icon = typeIcon(n.type);
  const content = (
    <div className="flex items-start gap-3">
      <div
        className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
          n.is_read ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-foreground text-sm break-words">{n.title}</p>
          {!n.is_read && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5 animate-badge-pulse" />
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-0.5 break-words">{n.message}</p>
        <p className="text-muted-foreground text-[11px] mt-1.5">{formatRelative(n.created_at)}</p>
      </div>
    </div>
  );

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className={`group rounded-2xl border p-4 transition-all animate-slide-up-bounce ${
        n.is_read
          ? "border-border bg-card hover:bg-secondary/40"
          : "border-primary/30 bg-primary/5 hover:bg-primary/10"
      }`}
    >
      {n.link ? (
        <Link to={n.link} onClick={() => !n.is_read && onRead(n.id)}>
          {content}
        </Link>
      ) : (
        <div onClick={() => !n.is_read && onRead(n.id)} className="cursor-pointer">
          {content}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.is_read && (
          <button
            onClick={() => onRead(n.id)}
            className="text-xs text-primary hover:underline flex items-center gap-1 btn-tactile"
          >
            <Check className="h-3 w-3" /> Make li
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          className="text-xs text-destructive hover:underline flex items-center gap-1 ml-auto btn-tactile"
        >
          <Trash2 className="h-3 w-3" /> Efase
        </button>
      </div>
    </div>
  );
};

const Notifications = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = page * PAGE_SIZE;
  const { data: notifications = [], isLoading } = useUserNotifications(limit);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const del = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const canLoadMore = notifications.length === limit;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-12 text-center">
          <p className="text-muted-foreground">Konekte pou wè notifikasyon w yo.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <div className="container py-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                Notifikasyon
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {unreadCount > 0 ? `${unreadCount} ki poko li` : "Tout li"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="btn-tactile"
              >
                <MailCheck className="h-4 w-4 mr-1.5" />
                Make tout li
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-secondary/50 animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3 animate-float" />
              <p className="text-muted-foreground">Pa gen notifikasyon ankò.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n, i) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  index={i}
                  onRead={(id) => markRead.mutate(id)}
                  onDelete={(id) => del.mutate(id)}
                />
              ))}

              {canLoadMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-tactile"
                  >
                    Chaje plis
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Notifications;
