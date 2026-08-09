import { useState } from "react"
import { X } from "lucide-react"
import api from "../../../utils/api"
import "./AddItemModal.css"

export default function AddItemModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "kg",
    stock: 0,
    minStock: 0,
    image: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { name, value, type } = e.target
    if (type === "number") {
      setFormData({ ...formData, [name]: value === "" ? "" : Number(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await api.post("/items", {
        ...formData,
        category: "general", // default category fallback for database schema
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Item (नया माल)</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name (माल का नाम) *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Loha, Sariya, Steel..."
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description (विवरण)</label>
            <textarea 
              name="description" 
              placeholder="Item description (optional)" 
              value={formData.description} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label>Unit (इकाई)</label>
            <select name="unit" value={formData.unit} onChange={handleChange}>
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram (g)</option>
              <option value="liter">Liter (L)</option>
              <option value="piece">Piece</option>
              <option value="box">Box</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, color: "#1e293b", marginBottom: 6, display: "block" }}>
              Stock / Opening Quantity (स्टॉक / मात्रा) *
            </label>
            <input
              type="number"
              name="stock"
              placeholder="Enter opening stock quantity (उदा. 50)"
              value={formData.stock}
              onChange={handleChange}
              step="any"
              required
            />
          </div>

          <div className="form-group">
            <label>Image (तस्वीर)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
