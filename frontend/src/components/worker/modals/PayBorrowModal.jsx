import { useState } from "react"
import { X } from "lucide-react"
import "./PayBorrowModal.css"

export default function PayBorrowModal({ type, borrowAmount, onClose, onPay }) {
  const [amount, setAmount] = useState(borrowAmount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (amount <= 0) {
      setError("Amount must be greater than 0")
      return
    }
    
    if (amount > borrowAmount) {
      setError(`Amount cannot exceed borrow amount of ₹${borrowAmount}`)
      return
    }

    setLoading(true)
    setError("")
    
    try {
      await onPay(parseFloat(amount))
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pay-borrow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pay Borrow Amount (उधार भुगतान)</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="borrow-info">
            <div className="info-row">
              <span>Total Borrow (कुल उधार):</span>
              <strong>₹{borrowAmount.toFixed(2)}</strong>
            </div>
          </div>

          <div className="form-group">
            <label>Payment Amount (भुगतान राशि) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              max={borrowAmount}
              placeholder="Enter amount to pay"
              required
              autoFocus
            />
            <small>Remaining will be: ₹{Math.max(0, borrowAmount - amount).toFixed(2)}</small>
          </div>

          <div className="quick-amounts">
            <button
              type="button"
              onClick={() => setAmount(borrowAmount / 2)}
              className="quick-btn"
            >
              Half
            </button>
            <button
              type="button"
              onClick={() => setAmount(borrowAmount)}
              className="quick-btn"
            >
              Full
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Processing..." : "Pay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
