import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from ".././src/context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import WorkerDashboard from "./pages/dashboard/WorkerDashboard"
import ViewInventory from "./components/worker/inventory/ViewInventory"
import ViewPurchases from "./components/worker/inventory/ViewPurchases"
import ViewSales from "./components/worker/inventory/ViewSales"
import "./App.css"

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/worker-dashboard"
            element={
              <ProtectedRoute requiredRole="worker">
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute requiredRole="worker">
              <ViewInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute requiredRole="worker">
              <ViewPurchases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute requiredRole="worker">
              <ViewSales />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
