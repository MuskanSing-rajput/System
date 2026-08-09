import { useState } from "react"
import { useNavigate, NavLink } from "react-router-dom"
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

  const handleNavClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      <button 
        className="menu-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
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
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/workers" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            Workers
          </NavLink>
          <NavLink 
            to="/attendance" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            Attendance
          </NavLink>
          <NavLink 
            to="/expenses" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            Expenses
          </NavLink>
          <NavLink 
            to="/reports" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            Reports
          </NavLink>
          <NavLink 
            to="/borrowers" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            Borrowers
          </NavLink>
          <NavLink 
            to="/stock" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            Stock
          </NavLink>
          <NavLink 
            to="/all-shops" 
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            All Shops Data
          </NavLink>
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
