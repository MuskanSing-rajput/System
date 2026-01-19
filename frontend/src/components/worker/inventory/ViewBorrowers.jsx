import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import api from "../../../utils/api"
import PayBorrowModal from "../modals/PayBorrowModal"
import Pagination from "../../../components/Pagination"
import "./ViewBorrowers.css"

export default function ViewBorrowers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [borrowers, setBorrowers] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [payBorrowModal, setPayBorrowModal] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchBorrowers()
  }, [])

  const fetchBorrowers = async () => {
    setInitialLoading(true)
    try {
      // Fetch both purchases and sales with borrow status
      const [purchasesRes, salesRes] = await Promise.all([
        api.get("/purchases"),
        api.get("/sales")
      ])

      const purchases = Array.isArray(purchasesRes.data) 
        ? purchasesRes.data 
        : Array.isArray(purchasesRes.data.data) 
        ? purchasesRes.data.data 
        : []

      const sales = Array.isArray(salesRes.data)
        ? salesRes.data
        : Array.isArray(salesRes.data.data)
        ? salesRes.data.data
        : []

      // Filter only borrow type and combine
      const borrowPurchases = purchases
        .filter(p => p.paymentType === "borrow" && p.borrowAmount > 0)
        .map(p => ({
          ...p,
          type: "purchase",
          partyName: p.supplierName,
          partyPhone: p.supplierPhone
        }))

      const borrowSales = sales
        .filter(s => s.paymentType === "borrow" && s.borrowAmount > 0)
        .map(s => ({
          ...s,
          type: "sale",
          partyName: s.customerName,
          partyPhone: s.customerPhone
        }))

      // Combine and sort by date (newest first)
      const combined = [...borrowPurchases, ...borrowSales].sort(
        (a, b) => new Date(b.saleDate || b.purchaseDate) - new Date(a.saleDate || a.purchaseDate)
      )

      setBorrowers(combined)
    } catch (error) {
      console.error("Error fetching borrowers:", error)
      setBorrowers([])
    } finally {
      setInitialLoading(false)
    }
  }

  const handlePayBorrow = async (amount) => {
    if (!payBorrowModal) return;
    
    try {
      const endpoint = payBorrowModal.type === "purchase" 
        ? `/purchases/${payBorrowModal.id}/pay-borrow`
        : `/sales/${payBorrowModal.id}/pay-borrow`
      
      await api.put(endpoint, { amount });
      alert("Payment recorded successfully!");
      setPayBorrowModal(null);
      fetchBorrowers();
    } catch (error) {
      alert(error.response?.data?.error || "Error updating payment");
    }
  };

  return (
    <div className="borrowers-container">
      <div className="page-header">
        {location.pathname !== "/worker-dashboard" && (
          <button className="back-btn" onClick={() => navigate("/worker-dashboard")}>
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
        )}
        <h2>All Borrowers (सभी उधारी)</h2>
      </div>

      {borrowers.length === 0 ? (
        initialLoading ? (
          <div className="small-wait">Wait ...</div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <p>No outstanding borrowers</p>
            <span>कोई बकाया उधारी नहीं है</span>
          </div>
        )
      ) : (
        <>
          <div className="table-responsive">
            <table className="borrowers-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Party Name</th>
                  <th>Phone</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                  <th>Borrow Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {borrowers
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((borrower) => (
                    <tr key={`${borrower.type}-${borrower.id}`}>
                      <td>
                        <span className={`type-badge ${borrower.type}`}>
                          {borrower.type === "purchase" ? "Purchase" : "Sale"}
                        </span>
                      </td>
                      <td><strong>{borrower.partyName || "-"}</strong></td>
                      <td>{borrower.partyPhone || "-"}</td>
                      <td>{borrower.item?.name || "-"}</td>
                      <td>{borrower.quantity} kg</td>
                      <td><strong>₹{borrower.totalAmount?.toFixed(2)}</strong></td>
                      <td>
                        <span className="borrow-amount">
                          ₹{borrower.borrowAmount?.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {new Date(borrower.saleDate || borrower.purchaseDate).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button 
                          onClick={() => setPayBorrowModal({ 
                            id: borrower.id, 
                            amount: borrower.borrowAmount,
                            type: borrower.type
                          })} 
                          className="btn-pay"
                        >
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={borrowers.length}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {payBorrowModal && (
        <PayBorrowModal
          type={payBorrowModal.type}
          borrowAmount={payBorrowModal.amount}
          onClose={() => setPayBorrowModal(null)}
          onPay={handlePayBorrow}
        />
      )}
    </div>
  )
}
