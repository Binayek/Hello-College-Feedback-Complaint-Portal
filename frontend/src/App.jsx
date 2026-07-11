import React from 'react';
//building blocks for navigationand routing
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
//provides notification messages
import { Toaster } from 'react-hot-toast';
//Accesses authentication functions from AuthContext.
import { AuthProvider, useAuth } from './context/AuthContext';

//importing components and pages for the application
import Sidebar from './components/shared/Sidebar';
import PublicRoute from "./components/shared/PublicRoute";
import Login from './pages/Login';
import Register from './pages/Register';
import CommunityBoard from './pages/shared/CommunityBoard';
import { StudentDashboard, StudentComplaints } from './pages/student/StudentPages';
import { TeacherDashboard, TeacherComplaints } from './pages/teacher/TeacherPages';
import { AdminDashboard, AdminComplaints, AdminAnalytics, AdminUsers } from './pages/admin/AdminPages';
import LandingPage from "./pages/LandingPage";

//css
import './index.css';

function AppLayout({ allowedRole }) {
  //Accesses the current user and loading state from the authentication context.
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  );

  //If the user is not logged in, redirect to the login page.
  if (!user) return <Navigate to="/login" replace />;
  //redirecting users to their respective dashboards based on their roles.
  if (allowedRole && user.role !== allowedRole) return <Navigate to={`/${user.role}`} replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content"><Outlet /></main>
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          {/* public */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>}/>
          <Route path="/register"  element={<PublicRoute><Register /></PublicRoute>}/>
          
          {/* Student */}
          <Route element={<AppLayout allowedRole="student" />}>
            <Route path="/student"             element={<StudentDashboard />} />
            <Route path="/student/community"   element={<CommunityBoard />} />
            <Route path="/student/complaints"  element={<StudentComplaints />} />
          </Route>

          {/* Teacher */}
          <Route element={<AppLayout allowedRole="teacher" />}>
            <Route path="/teacher"             element={<TeacherDashboard />} />
            <Route path="/teacher/community"   element={<CommunityBoard />} />
            <Route path="/teacher/complaints"  element={<TeacherComplaints />} />
          </Route>

          {/* Admin */}
          <Route element={<AppLayout allowedRole="admin" />}>
            <Route path="/admin"               element={<AdminDashboard />} />
            <Route path="/admin/community"     element={<CommunityBoard />} />
            <Route path="/admin/complaints"    element={<AdminComplaints />} />
            <Route path="/admin/analytics"     element={<AdminAnalytics />} />
            <Route path="/admin/users"         element={<AdminUsers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
