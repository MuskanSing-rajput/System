import { useState, useMemo } from "react"
import { X } from "lucide-react"
import api from "../../../utils/api"
import "./AddPurchaseModal.css"

export default function AddPurchaseModal({ onClose,onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    unitPrice: "",
    supplier: "",
    supplierPhone: "",
    unit: "kg",
    image: "",
    paymentType: "paid", 
    borrowAmount: "", 
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Calculate total amount
  const totalAmount = useMemo(() => {
    const qty = parseFloat(formData.quantity) || 0
    const price = parseFloat(formData.unitPrice) || 0
    return (qty * price).toFixed(2)
  }, [formData.quantity, formData.unitPrice])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const baseQuantity =
        formData.unit === "gram"
          ? parseFloat(formData.quantity) / 1000
          : parseFloat(formData.quantity)

      const total = baseQuantity * parseFloat(formData.unitPrice)

      const finalBorrowAmount =
        formData.paymentType === "borrow"
          ? formData.borrowAmount
            ? parseFloat(formData.borrowAmount)
            : total
          : 0

      await api.post("/purchases", {
        itemName: formData.itemName,
        unit: formData.unit,
        quantity: baseQuantity,
        unitPrice: parseFloat(formData.unitPrice),
        supplierName: formData.supplier,
        supplierPhone: formData.supplierPhone || null,
        image: formData.image,
        paymentType: formData.paymentType,
        borrowAmount: finalBorrowAmount,
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Purchase (खरीद)</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Item Name * (माल)</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity * (मात्रा)</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Unit (इकाई)</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Unit Price (₹) * (इकाई मूल्य)</label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="Enter unit price"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="form-group total-display">
              <label>Total Amount (₹)</label>
              <div className="total-value">₹{totalAmount}</div>
            </div>
          </div>

          <div className="form-group">
            <label>Payment Type (भुगतान का प्रकार)</label>
            <select name="paymentType" value={formData.paymentType} onChange={handleChange}>
              <option value="paid">Paid (नगद)</option>
              <option value="borrow">Borrow (उधार)</option>
            </select>
          </div>

          {formData.paymentType === "borrow" && (
            <div className="form-group">
              <label>Borrow Amount (₹) (उधार राशि)</label>
              <input
                type="number"
                name="borrowAmount"
                value={formData.borrowAmount}
                onChange={handleChange}
                placeholder="उधार राशि (खाली = पूर्ण राशि)"
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Supplier Name (देने वाला)</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Enter supplier name"
              />
            </div>
            <div className="form-group">
              <label>Supplier Phone (फ़ोन)</label>
              <input
                type="tel"
                name="supplierPhone"
                value={formData.supplierPhone}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength="10"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
