import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import AddItemModal from "../modals/AddItemModal"
import ImageModal from "../../../components/ImageModal"
import api from "../../../utils/api"
import "./ViewInventory.css"
import Pagination from "../../../components/Pagination"

export default function ViewInventory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 11

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setInitialLoading(true)
    try {
      const { data } = await api.get("/items")
      setItems(data)
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setInitialLoading(false)
    }
  }

  return (
    <div className="inventory-container">
      {location.pathname !== "/worker-dashboard" && (
        <button className="back-btn" onClick={() => navigate("/worker-dashboard")}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
      )}
      <div className="inventory-header">
        <h2>Inventory - {items.length} items (इन्वेंटरी)</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Item
        </button>
      </div>

      {showModal && <AddItemModal onClose={() => setShowModal(false)} onSuccess={fetchItems} />}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}

      {items.length === 0 ? (
        initialLoading ? (
          <div className="small-wait">Wait ...</div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No items found</p>
            <span>कोई आइटम नहीं मिला। अपना पहला आइटम जोड़ें!</span>
          </div>
        )
      ) : (
        <>
          <div className="table-responsive">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  {/* <th>Min Stock</th> */}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.slice((page - 1) * pageSize, page * pageSize).map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category}</td>
                    <td className={item.stock < item.minStock ? "low-stock" : ""}>
                      <strong>{item.stock}</strong>
                    </td>
                    <td>{item.unit}</td>
                    {/* <td>{item.minStock}</td> */}
                    <td>
                      {item.stock < item.minStock ? (
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ Low Stock</span>
                      ) : item.stock === 0 ? (
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>❌ Out of Stock</span>
                      ) : (
                        <span style={{ color: '#10b981' }}>✓ In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={items.length}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  )
}
