import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import LibraryPage from "./pages/LibraryPage";
import DocumentViewerPage from "./pages/DocumentViewerPage";
import ChatPage from "./pages/ChatPage";
import AnalysisPage from "./pages/AnalysisPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/library/:id" element={<DocumentViewerPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
