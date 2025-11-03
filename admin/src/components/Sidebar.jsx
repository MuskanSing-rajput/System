import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/Sidebar.css"

export default function Sidebar({ user, setIsAuthenticated }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    navigate("/login")
  }

  return (
    <>
      <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-link">
            Dashboard
          </a>
          <a href="/workers" className="nav-link">
            Workers
          </a>
          <a href="/attendance" className="nav-link">
            Attendance
          </a>
          <a href="/expenses" className="nav-link">
            Expenses
          </a>
          <a href="/reports" className="nav-link">
            Reports
          </a>
          <a href="/all-shops" className="nav-link">
            All Shops Data
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p>{user?.name}</p>
            <small>{user?.role}</small>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  )
}
