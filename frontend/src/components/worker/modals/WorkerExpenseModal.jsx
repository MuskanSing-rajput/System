import { useState, useEffect } from "react"
import { X } from "lucide-react"
import api from "../../../utils/api"
import "./WorkerExpenseModal.css"

export default function WorkerExpenseModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ title: "", amount: "" })
  const [remainingFund, setRemainingFund] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [fundLoading, setFundLoading] = useState(true)

  useEffect(() => {
    fetchFund()
  }, [])

  const fetchFund = async () => {
    try {
      const { data } = await api.get("/funds")
      setRemainingFund(data.currentRemaining || 0)
    } catch (err) {
      console.error("Error fetching balance:", err)
      setRemainingFund(0)
    } finally {
      setFundLoading(false)
    }
  }
 
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const res = await api.post("/worker-expense", formData)
      setSuccess("Expense added successfully!")
      setRemainingFund(res.data.remainingFund)
      setFormData({ title: "", amount: "" })
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content2" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
        <h2>Worker Expense (खर्च)</h2>
        <p className="fund-info">
          {fundLoading ? "Loading..." : `Available Fund (उपलब्ध राशि): ₹${remainingFund.toFixed(2)}`}
        </p>
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group2">
            <label>Expense Title * (खर्च वस्तु)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter expense title (खर्च का शीर्षक)"
              required
            />
          </div>
          <div className="form-group2">
            <label>Amount * (राशि)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount (राशि दर्ज करें)"
              required
            />
          </div>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "📝 Add Expense"}
          </button>
        </form>
      </div>
    </div>
  )
}
