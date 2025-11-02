"use client"

import { useState, useEffect } from "react"
import api from "../../../utils/api"
import ImageModal from "../../../components/ImageModal"
import "./ViewPurchases.css"

export default function ViewPurchases() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

const fetchPurchases = async () => {
  try {
    const { data } = await api.get("/purchases")

    //  Ensure purchases is always an array
    const purchaseArray = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : []

    setPurchases(purchaseArray)
  } catch (error) {
    console.error("Error fetching purchases:", error)
    setPurchases([])
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="purchases-container">
      <h2>Purchase History</h2>
      {loading ? (
       <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Loading purchase...</p>
      </div>) : purchases.length === 0 ? (
        <div className="empty-state">No purchases found</div>
      ) : (
        <div className="table-responsive">
          <table className="purchases-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item</th>
                <th>Supplier</th>
                <th>Worker</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>
                    {purchase.image ? (
                      <img
                        src={purchase.image}
                        alt={purchase.item?.name}
                        className="purchase-image clickable-image"
                        onClick={() => setSelectedImage(purchase.image)}
                        title="Click to view full image"
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td>{purchase.item?.name || "-"}</td>
                  <td>{purchase.supplierName}</td>
                  <td>{purchase.user?.name || "-"}</td>
                  <td>{purchase.quantity}</td>
                  <td>₹{purchase.unitPrice?.toFixed(2)}</td>
                  <td>₹{purchase.totalAmount?.toFixed(2)}</td>
                  <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
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
