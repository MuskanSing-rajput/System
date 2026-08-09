import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../../utils/api";
import ImageModal from "../../../components/ImageModal";
import PayBorrowModal from "../modals/PayBorrowModal";
import "./ViewPurchases.css";
import Pagination from "../../../components/Pagination"

export default function ViewPurchases() {
  const navigate = useNavigate();
  const location = useLocation();
  const [purchases, setPurchases] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [payBorrowModal, setPayBorrowModal] = useState(null);
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setInitialLoading(true);
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
      setInitialLoading(false);
    }
  };

  const handlePayBorrow = async (amount) => {
    try {
      await api.put(`/purchases/${payBorrowModal.id}/pay-borrow`, { amount });
      alert("Payment recorded successfully!");
      fetchPurchases();
      setPayBorrowModal(null);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="purchases-container">
      <div className="page-header">
        {location.pathname !== "/worker-dashboard" && (
          <button className="back-btn" onClick={() => navigate("/worker-dashboard")}>
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
        )}
        <h2>Purchase History - Today (आज की खरीदारी)</h2>
      </div>
      {purchases.length === 0 ? (
        initialLoading ? (
          <div className="small-wait">Wait ...</div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No purchases found for today</p>
            <span>आज कोई खरीदारी नहीं हुई</span>
          </div>
        )
      ) : (
        <>
          <div className="table-responsive">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Supplier</th>
                  <th>Phone</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {purchases
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((purchase) => {
                    const dateObj = new Date(purchase.purchaseDate);
                    const istTime = dateObj.toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <tr key={purchase.id}>
                        <td><strong>{purchase.item?.name || "-"}</strong></td>
                        <td>{purchase.supplierName || "-"}</td>
                        <td>{purchase.supplierPhone || "-"}</td>
                        <td>{purchase.quantity} kg</td>
                        <td>₹{purchase.unitPrice?.toFixed(2)}</td>
                        <td><strong>₹{purchase.totalAmount?.toFixed(2)}</strong></td>
                        <td>
                          {purchase.paymentType === "borrow" ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#f59e0b' }}>₹{purchase.borrowAmount} (उधार)</span>
                              <button
                                onClick={() => setPayBorrowModal({ id: purchase.id, amount: purchase.borrowAmount })}
                                className="btn-pay"
                              >
                                Pay
                              </button>
                            </span>
                          ) : (
                            <span style={{ color: '#10b981' }}>✓ Paid (नगद)</span>
                          )}
                        </td>
                        <td>{istTime}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={purchases.length}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
      {payBorrowModal && (
        <PayBorrowModal
          type="purchase"
          borrowAmount={payBorrowModal.amount}
          onClose={() => setPayBorrowModal(null)}
          onPay={handlePayBorrow}
        />
      )}
    </div>
  );
}
