import { useState, useEffect } from "react"
import api from "../../../utils/api"
import ImageModal from "../../../components/ImageModal"
import "./ViewSales.css"

export default function ViewSales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchSales()
  }, [])

const fetchSales = async () => {
  try {
    setLoading(true)
    const { data } = await api.get("/sales")
    const salesArray = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : []

    setSales(salesArray)
  } catch (error) {
    console.error("Error fetching sales:", error)
    setSales([])
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="sales-container">
      <h2>Sales History</h2>
     {loading ? (
       <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Loading sales...</p>
      </div>
      ) : sales.length === 0 ? (
        <div className="empty-state">No sales found</div>
      ) : (
        <div className="table-responsive">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item</th>
                <th>Customer</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    {sale.image ? (
                      <img
                        src={sale.image}
                        alt={sale.item?.name}
                        className="sale-image clickable-image"
                        onClick={() => setSelectedImage(sale.image)}
                        title="Click to view full image"
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td>{sale.item?.name || "-"}</td>
                  <td>{sale.customerName}</td>
                  <td>{sale.quantity} kg</td>
                  <td>₹{sale.unitPrice?.toFixed(2)}</td>
                  <td>₹{sale.totalAmount?.toFixed(2)}</td>
                  <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  )
}
