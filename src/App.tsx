import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NovelDetail from "./pages/NovelDetail";
import ChapterReader from "./pages/ChapterReader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import SearchPage from "./pages/SearchPage";
import LecturePage from "./pages/LecturePage";
import CanvasPage from "./pages/CanvasPage";
import Notifications from "./pages/Notifications";
import AuthorDashboard from "./pages/AuthorDashboard";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import { useRealtimeNotifications } from "@/hooks/useExtra";

const queryClient = new QueryClient();

const RealtimeBootstrap = () => {
  useRealtimeNotifications();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RealtimeBootstrap />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/novel/:id" element={<NovelDetail />} />
            <Route path="/chapter/:novelId/:chapterId" element={<ProtectedRoute><ChapterReader /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/lecture" element={<LecturePage />} />
            <Route path="/canvas" element={<CanvasPage />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/author/dashboard" element={<ProtectedRoute><AuthorDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
