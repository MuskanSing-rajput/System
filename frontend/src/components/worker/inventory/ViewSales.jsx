import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import api from "../../../utils/api"
import ImageModal from "../../../components/ImageModal"
import PayBorrowModal from "../modals/PayBorrowModal"
import "./ViewSales.css"
import Pagination from "../../../components/Pagination"

export default function ViewSales() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sales, setSales] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [payBorrowModal, setPayBorrowModal] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    setInitialLoading(true)
    try {
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
      setInitialLoading(false)
    }
  }

  const handlePayBorrowSale = async (amount) => {
    if (!payBorrowModal) return;
    try {
      await api.put(`/sales/${payBorrowModal.id}/pay-borrow`, { amount });
      alert("Payment recorded successfully!");
      setPayBorrowModal(null);
      fetchSales();
    } catch (error) {
      alert(error.response?.data?.error || "Error updating sale");
    }
  };

  return (
    <div className="sales-container">
      <div className="page-header">
        {location.pathname !== "/worker-dashboard" && (
          <button className="back-btn" onClick={() => navigate("/worker-dashboard")}>
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
        )}
        <h2>Sales History - Today (आज की बिक्री)</h2>
      </div>
      {sales.length === 0 ? (
        initialLoading ? (
          <div className="small-wait">Wait ...</div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>No sales found for today</p>
            <span>आज कोई बिक्री नहीं हुई</span>
          </div>
        )
      ) : (
        <>
          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Payment Type</th>
                  {/* <th>Payment Type</th> */}
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sales
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((sale) => (
                    <tr key={sale.id}>
                      <td><strong>{sale.item?.name || "-"}</strong></td>
                      <td>{sale.customerName || "-"}</td>
                      <td>{sale.customerPhone || "-"}</td>
                  <td>{sale.customerPhone || "-"}</td>
                  <td>{sale.quantity} kg</td>
                  {/* <td>₹{sale.unitPrice?.toFixed(2)}</td> */}
                  <td><strong>₹{sale.totalAmount?.toFixed(2)}</strong></td>
                  <td>
                    {sale.paymentType === "borrow" ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#f59e0b' }}>₹{sale.borrowAmount} (उधार)</span>
                        <button onClick={() => setPayBorrowModal({ id: sale.id, amount: sale.borrowAmount })} className="btn-pay">
                          Pay
                        </button>
                      </span>
                    ) : (
                      <span style={{ color: '#10b981' }}>✓ Paid (नकद)</span>
                    )}
                  </td>
                  <td>{new Date(sale.saleDate).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={sales.length}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
      {payBorrowModal && (
        <PayBorrowModal
          type="sale"
          borrowAmount={payBorrowModal.amount}
          onClose={() => setPayBorrowModal(null)}
          onPay={handlePayBorrowSale}
        />
      )}
    </div>
  )
}
