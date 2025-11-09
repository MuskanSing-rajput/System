import { useState, useEffect } from "react";
import api from "../../../utils/api";
import ImageModal from "../../../components/ImageModal";
import "./ViewPurchases.css";

export default function ViewPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data } = await api.get("/purchases");

      const purchaseArray = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      setPurchases(purchaseArray);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayBorrow = async (id, amount) => {
    if (!window.confirm(`Pay ₹${amount}?`)) return;
    try {
      await api.put(`/purchases/${id}/pay-borrow`, { amount });
      alert("Borrow amount paid!");
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.error || "Error paying borrow amount");
    }
  };

  return (
    <div className="purchases-container">
      <h2>Purchase History</h2>
      {loading ? (
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
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
                <th>Payment Type</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const dateObj = new Date(purchase.purchaseDate);
                const istDate = dateObj.toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                });
               const istTime = dateObj.toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",  
                hour12: true,        
              });

                return (
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
                    <td>{purchase.quantity} kg</td>
                    <td>₹{purchase.unitPrice?.toFixed(2)}</td>
                    <td>₹{purchase.totalAmount?.toFixed(2)}</td>
                    <td>
                      {purchase.paymentType === "borrow" ? (
                        <>
                          <span>{purchase.borrowAmount} ₹ (उधार)</span>&nbsp;
                          <button
                            onClick={() =>
                              handlePayBorrow(purchase.id, purchase.borrowAmount)
                            }
                            className="btn-pay"
                          >
                            Pay
                          </button>
                        </>
                      ) : (
                        <span>(नगद)</span>
                      )}
                    </td>
                    <td>{istTime}</td>
                    <td>{istDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
