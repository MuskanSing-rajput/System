import { useState, useEffect } from "react";
import api from "../utils/api";
import Pagination from "../components/Pagination";
import "../styles/Borrowers.css";

export default function Borrowers() {
  const [borrowers, setBorrowers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchWorkers();
    fetchBorrowers();
  }, [selectedWorker]);

  // derive unique shop ids from workers to avoid duplicate options
  const shopOptions = [];
  const _seenShops = new Set();
  workers.forEach((w) => {
    const sid = w.user?.shopId || w.shopId;
    if (sid && !_seenShops.has(sid)) {
      _seenShops.add(sid);
      shopOptions.push(sid);
    }
  });

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get("/workers");
      setWorkers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchBorrowers = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedWorker !== "all") {
        // selectedWorker holds the shopId directly
        params.append('shopId', selectedWorker);
      }
      params.append('paymentType', 'borrow');

      // Fetch purchases and sales
      const [purchasesRes, salesRes] = await Promise.all([
        api.get(`/purchases?${params.toString()}`),
        api.get(`/sales?${params.toString()}`)
      ]);

      const purchases = Array.isArray(purchasesRes.data?.data) 
        ? purchasesRes.data.data 
        : Array.isArray(purchasesRes.data) 
        ? purchasesRes.data 
        : [];

      const sales = Array.isArray(salesRes.data?.data)
        ? salesRes.data.data
        : Array.isArray(salesRes.data)
        ? salesRes.data
        : [];

      // Filter only borrow type and combine
      const borrowPurchases = purchases
        .filter(p => p.paymentType === "borrow" && p.borrowAmount > 0)
        .map(p => ({
          ...p,
          type: "purchase",
          partyName: p.supplierName,
          partyPhone: p.supplierPhone,
          workerName: p.user?.name || "Unknown"
        }));

      const borrowSales = sales
        .filter(s => s.paymentType === "borrow" && s.borrowAmount > 0)
        .map(s => ({
          ...s,
          type: "sale",
          partyName: s.customerName,
          partyPhone: s.customerPhone,
          workerName: s.user?.name || "Unknown"
        }));

      // Combine and sort by date (newest first)
      const combined = [...borrowPurchases, ...borrowSales].sort(
        (a, b) => new Date(b.saleDate || b.purchaseDate) - new Date(a.saleDate || a.purchaseDate)
      );

      setBorrowers(combined);
    } catch (error) {
      console.error("Error fetching borrowers:", error);
      setBorrowers([]);
    } finally {
      setLoading(false);
    }
  };

  const totalBorrow = borrowers.reduce((sum, b) => sum + (b.borrowAmount || 0), 0);

  const handleAdminReceive = async (borrower) => {
    try {
      const promptMsg = `Enter amount received from ${borrower.partyName || 'borrower'} (remaining ₹${borrower.borrowAmount}):`;
      const input = window.prompt(promptMsg, "");
      if (!input) return;
      const amount = parseFloat(input);
      if (isNaN(amount) || amount <= 0) {
        return alert('Please enter a valid amount');
      }
      if (amount > (borrower.borrowAmount || 0)) {
        return alert('Amount cannot be greater than remaining borrow amount');
      }

      const endpoint = borrower.type === "purchase"
        ? `/purchases/${borrower.id}/pay-borrow`
        : `/sales/${borrower.id}/pay-borrow`;

      await api.put(endpoint, { amount });
      alert('Payment recorded successfully');
      fetchBorrowers();
    } catch (error) {
      console.error('Error recording payment', error);
      alert(error.response?.data?.error || 'Error recording payment');
    }
  };

  return (
    <div className="borrowers-page">
      <div className="page-header">
        <div>
          <h1>Borrowers Management</h1>
          <p>Track all outstanding payments across shops</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Outstanding</span>
            <span className="stat-value">₹{totalBorrow.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Borrowers</span>
            <span className="stat-value">{borrowers.length}</span>
          </div>
        </div>
      </div>

      <div className="filters">
        <label>
          <span>Filter by Shop:</span>
          <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
            <option value="all">All Shops</option>
            {shopOptions.map((shopId) => (
              <option key={shopId} value={shopId}>
                {shopId}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="loading">Loading borrowers...</div>
      ) : borrowers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <p>No outstanding borrowers found</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="borrowers-table">
              <thead>
                <tr>
                  <th>Shop / Worker</th>
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
                        <div className="worker-info">
                          <strong>{borrower.workerName}</strong>
                        </div>
                      </td>
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
                        <button className="btn-receive" onClick={() => handleAdminReceive(borrower)}>
                          Receive
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
    </div>
  );
}
