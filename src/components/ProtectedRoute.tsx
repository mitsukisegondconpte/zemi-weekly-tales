import { useAuth } from "@/contexts/AuthContext";
import { useIsAuthor } from "@/hooks/useAuthor";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
  authorOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false, authorOnly = false }: Props) => {
  const { user, loading, isAdmin } = useAuth();
  const isAuthor = useIsAuthor();
  const location = useLocation();
  const toasted = useRef(false);

  const denied =
    !loading && user && (
      (adminOnly && !isAdmin) ||
      (authorOnly && !isAuthor && !isAdmin)
    );

  useEffect(() => {
    if (denied && !toasted.current) {
      toasted.current = true;
      if (adminOnly) {
        toast.error("Aksè refize", { description: "Ou pa gen otorizasyon admin." });
      } else if (authorOnly) {
        toast.error("Sèlman pou otè apwouve", {
          description: "Ou dwe yon otè apwouve pou aksede paj sa a.",
        });
      }
    }
  }, [denied, adminOnly, authorOnly]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (authorOnly && !isAuthor && !isAdmin) return <Navigate to="/profile" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
