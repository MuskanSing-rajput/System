import { useState } from "react"
import { useNavigate, NavLink } from "react-router-dom"
import { Menu, LayoutDashboard, ShoppingCart, TrendingUp, Package, LogOut } from "lucide-react"
import "./Sidebar.css"

export default function Sidebar({ user, logout }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const closeMenu = () => setIsOpen(false)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <p>{user?.role?.toUpperCase()}</p>
          </div>
          <button className="menu-btn" onClick={() => setIsOpen((s) => !s)} aria-label="Toggle menu">
            <Menu size={22} />
          </button>
        </div>
      </div>

      <nav className={`sidebar-nav ${isOpen ? 'open' : ''}`}>
        <NavLink 
          to="/worker-dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={closeMenu}
        >
          <LayoutDashboard size={18} style={{ marginRight: 10 }} />
          Dashboard
        </NavLink>

        {user?.role === "worker" && (
          <>
            <NavLink 
              to="/purchases" 
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={closeMenu}
            >
              <ShoppingCart size={18} style={{ marginRight: 10 }} />
              Purchases
            </NavLink>
            <NavLink 
              to="/sales" 
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={closeMenu}
            >
              <TrendingUp size={18} style={{ marginRight: 10 }} />
              Sales
            </NavLink>
            <NavLink 
              to="/inventory" 
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={closeMenu}
            >
              <Package size={18} style={{ marginRight: 10 }} />
              Inventory
            </NavLink>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={closeMenu}
            >
              Reports
            </NavLink>
            <NavLink 
              to="/users" 
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={closeMenu}
            >
              Users
            </NavLink>
          </>
        )}

        <button className="logout-btn nav-item" onClick={handleLogout}>
          <LogOut size={18} style={{ marginRight: 10 }} />
          Logout
        </button>
      </nav>

      <button className="logout-btn desktop-logout" onClick={handleLogout}>
        <LogOut size={18} style={{ marginRight: 8 }} />
        Logout
      </button>
    </aside>
  )
}
