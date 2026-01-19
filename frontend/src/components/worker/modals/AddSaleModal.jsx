import { useState, useEffect, useMemo } from "react"
import { X } from "lucide-react"
import api from "../../../utils/api"
import "./AddSaleModal.css"

export default function AddSaleModal({ onClose }) {
  const [items, setItems] = useState([])
  const [formData, setFormData] = useState({
    itemId: "",
    quantity: "",
    unitPrice: "",
    customer: "",
    customerPhone: "",
    saleDate: new Date().toISOString().split('T')[0],
    image: "",
    paymentType: "paid", 
    borrowAmount: "", 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const { data } = await api.get("/items/item-name")
      const uniqueItems = Array.from(
        new Map(data.map((item) => [item.name, item])).values()
      )
      setItems(uniqueItems)
    } catch (err) {
      console.error("Error fetching items:", err)
    }
  }

  // Get selected item details
  const selectedItem = useMemo(() => {
    return items.find(item => item.id === formData.itemId)
  }, [items, formData.itemId])

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
      const quantity = parseFloat(formData.quantity) || 0
      const unitPrice = parseFloat(formData.unitPrice) || 0
      const borrowAmountInput = formData.borrowAmount ? parseFloat(formData.borrowAmount) : null

      if (!formData.itemId) {
        throw new Error("Please select an item.")
      }
      if (!quantity || quantity <= 0) {
        throw new Error("Please enter a valid quantity (> 0).")
      }
      if (!unitPrice || unitPrice <= 0) {
        throw new Error("Please enter a valid unit price (> 0).")
      }
      if (!formData.saleDate) {
        throw new Error("Please select a sale date.")
      }

      // Check stock availability
      if (selectedItem && quantity > selectedItem.stock) {
        throw new Error(`Insufficient stock! Available: ${selectedItem.stock} ${selectedItem.unit}`)
      }

      const total = quantity * unitPrice
      const finalBorrowAmount = formData.paymentType === "borrow"
        ? (borrowAmountInput !== null && !isNaN(borrowAmountInput) ? borrowAmountInput : total)
        : 0

      const payload = {
        itemId: formData.itemId,
        quantity,
        unitPrice,
        customerName: formData.customer || null,
        customerPhone: formData.customerPhone || null,
        saleDate: formData.saleDate,
        image: formData.image || null,
        paymentType: formData.paymentType,
        borrowAmount: finalBorrowAmount,
        totalAmount: total,
      }
      
      await api.post("/sales", payload)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Sale (बिक्री)</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Item * (माल)</label>
            <select name="itemId" value={formData.itemId} onChange={handleChange} required>
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Stock: {item.stock} {item.unit})
                </option>
              ))}
            </select>
            {/* {selectedItem && (
              <small className="stock-info">
                Available Stock: <strong>{selectedItem.stock} {selectedItem.unit}</strong>
              </small>
            )} */}
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
                max={selectedItem?.stock || ""}
                required
              />
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
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group total-display">
            <label>Total Amount (₹) (कुल राशि)</label>
            <div className="total-value">₹{totalAmount}</div>
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
              <label>Customer Name (ग्राहक)</label>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                placeholder="Enter customer name"
              />
            </div>
            <div className="form-group">
              <label>Customer Phone (फ़ोन)</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength="10"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Sale Date *</label>
            <input
              type="date"
              name="saleDate"
              value={formData.saleDate}
              onChange={handleChange}
              required
            />
          </div>

  
          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
