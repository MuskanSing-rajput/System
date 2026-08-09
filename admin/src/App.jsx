import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Attendance from "./pages/Attendance";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import AllShopsData from "./pages/AllShopsData";
import Borrowers from "./pages/Borrowers";
import Stock from "./pages/Stock";
import Sidebar from "./components/Sidebar";
import "./App.css";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          )
        }
      />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <div className="app-layout">
              <Sidebar user={user} setIsAuthenticated={setIsAuthenticated} />
              <div className="main-content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/workers" element={<Workers />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/all-shops" element={<AllShopsData />} />
                  <Route path="/borrowers" element={<Borrowers />} />
                  <Route path="/stock" element={<Stock />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}
