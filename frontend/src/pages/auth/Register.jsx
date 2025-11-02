"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import api from "../../utils/api"
import "./Auth.css"

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "worker",
    shopId: "shop1",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        shopId: formData.role === "worker" ? formData.shopId : undefined,
      })

      navigate("/login")
    }  catch (err) {
  console.error("❌ Registration Error:", err); // 👈 log full error in console

  // Try to get a meaningful message
  if (err.response) {
    console.error("🧭 Server responded with:", err.response.data);
    console.error("🔢 Status Code:", err.response.status);
    setError(err.response.data?.error || `Server Error: ${err.response.status}`);
  } else if (err.request) {
    console.error("📡 No response received from server:", err.request);
    setError("No response from server. Please check if backend is running.");
  } else {
    console.error("⚙️ Request setup error:", err.message);
    setError(`Error: ${err.message}`);
  }
}

  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Business Management System</h1>
        <h2>Register</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <div className="password-field-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="password-field-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((s) => !s)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>
          {formData.role === "worker" && (
            <select name="shopId" value={formData.shopId} onChange={handleChange} required>
              <option value="shop1">Shop 1</option>
              <option value="shop2">Shop 2</option>
              <option value="shop3">Shop 3</option>
            </select>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  )
}
