import { useState } from "react"
import api from "../../../utils/api"
import "./AddPurchaseModal.css"

export default function AddPurchaseModal({ onClose,onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    unitPrice: "",
    supplier: "",
    unit: "kg",
    image: "",
    paymentType: "paid", 
    borrowAmount: "", 
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
          ? Number.parseFloat(formData.quantity) / 1000
          : Number.parseFloat(formData.quantity)

      const totalAmount = baseQuantity * Number.parseFloat(formData.unitPrice)

      // If borrow is selected and no amount entered → full amount is borrowed
      const finalBorrowAmount =
        formData.paymentType === "borrow"
          ? formData.borrowAmount
            ? Number.parseFloat(formData.borrowAmount)
            : totalAmount
          : 0

      await api.post("/purchases", {
        itemName: formData.itemName,
        unit: formData.unit,
        quantity: baseQuantity,
        unitPrice: Number.parseFloat(formData.unitPrice),
        supplierName: formData.supplier,
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
          <h2>Add Purchase</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
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
                required
              />
            </div>
            <div className="form-group">
              <label>Unit (इकाई)</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="kg">kg</option>
                <option value="gram">gram</option>
              </select>
            </div>
            <div className="form-group">
              <label>Unit Price (₹) * (इकाई मूल्य)</label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="Enter unit price"
                step="0.01"
                required
              />
            </div>
          </div>

            {/* Payment Type */}
          <div className="form-group">
            <label>Payment Type (भुगतान का प्रकार)</label>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
            >
              <option value="paid">Paid (नगद)</option>
              <option value="borrow">Borrow (उधार)</option>
            </select>
          </div>

          {/* Borrow Amount Field (only show if "borrow" selected) */}
          {formData.paymentType === "borrow" && (
            <div className="form-group">
              <label>Borrow Amount (₹) (उधार राशि)</label>
              <input
                type="number"
                name="borrowAmount"
                value={formData.borrowAmount}
                onChange={handleChange}
                placeholder="उधार ली गई राशि दर्ज करें (पूरी राशि के लिए खाली छोड़ दें)"
              />
            </div>
          )}

          <div className="form-group">
            <label>Supplier (देने वाला)</label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="form-group">
            <label>Image/Receipt</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                style={{ width: 100, marginTop: 10 }}
              />
            )}
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
