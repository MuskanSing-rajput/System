import { useState } from "react"
import api from "../../../utils/api"
import "./AddAmountModal.css"

export default function AddAmountModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: "",
    givenBy: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await api.post("/funds", formData)
      setSuccess("Amount successfully added!")
      setFormData({ amount: "", givenBy: "" })
      if (onSuccess) onSuccess() // refresh balance immediately
      setTimeout(onClose, 1000)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content2" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Add Amount</h2>
        <form onSubmit={handleSubmit} className="add-amount-form">
          <div className="form-group2">
            <label>Amount * (रुपया)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group2">
            <label>Given By (किसने दिया)</label>
            <input
              type="text"
              name="givenBy"
              value={formData.givenBy}
              onChange={handleChange}
            />
          </div>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add"}
          </button>
        </form>
      </div>
    </div>
  )
}
