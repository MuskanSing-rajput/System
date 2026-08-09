import { useState, useEffect, useContext } from "react"
import api from "../../utils/api"
import { AuthContext } from "../../context/AuthContext"
import Sidebar from "../../components/Sidebar"
import DashboardOverview from "../../components/worker/DashboardOverview"
import InventoryTabs from "../../components/worker/InventoryTabs"
import "./Dashboard.css"

export default function WorkerDashboard() {
  const { user, logout } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/dashboard/stats")
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} logout={logout} />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Worker Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </header>

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </button>
        </div>

        <div className="dashboard-body">
          {activeTab === "overview" && <DashboardOverview stats={stats} loading={loading} onRefresh={fetchStats} />}
          {activeTab === "inventory" && <InventoryTabs />}
        </div>
      </div>
    </div>
  )
}
