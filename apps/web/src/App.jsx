import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import InformasiPage from './pages/InformasiPage';
import BioPage from './pages/BioPage';
import ActivityPage from './pages/ActivityPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import usePwaManifest from './hooks/usePwaManifest';

function App() {
    usePwaManifest();
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <PwaInstallPrompt />
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/informasi" element={<InformasiPage />} />
                    <Route path="/bio" element={<BioPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute redirectTo="/admin/login">
                                <AdminPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
