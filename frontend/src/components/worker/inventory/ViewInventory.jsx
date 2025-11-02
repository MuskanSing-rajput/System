import { useState, useEffect } from "react"
import AddItemModal from "../modals/AddItemModal"
import ImageModal from "../../../components/ImageModal"
import api from "../../../utils/api"
import "./ViewInventory.css"

export default function ViewInventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/items")
      setItems(data)
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h2>Inventory</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Item
        </button>
      </div>

      {showModal && <AddItemModal onClose={() => setShowModal(false)} onSuccess={fetchItems} />}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}

      {loading ? (
       <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Loading items...</p>
      </div>
      ) : items.length === 0 ? (
        <div className="empty-state">No items found. Add your first item!</div>
      ) : (
        <div className="table-responsive">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Min Stock</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
          {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="item-image clickable-image"
                        onClick={() => setSelectedImage(item.image)}
                        title="Click to view full image"
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td className={item.stock < item.minStock ? "low-stock" : ""}>{item.stock}</td>
                  <td>{item.unit}</td>
                  <td>{item.minStock}</td>
                  <td className="description-cell">{item.description || "-"}</td>
                </tr>
          ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
