// import { useState, useEffect } from "react"
// import api from "../utils/api"
// import "../styles/AllShopsData.css"

// export default function AllShopsData() {
//   const [sales, setSales] = useState([])
//   const [purchases, setPurchases] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [selectedShop, setSelectedShop] = useState("all")
//   const [editingItem, setEditingItem] = useState(null)
//   const [saving, setSaving] = useState(false);
//   const [editType, setEditType] = useState("") 
//   const [startDate, setStartDate] = useState(
//     new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
//   )
//   const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])

//   useEffect(() => {
//     fetchAllData()
//   }, [startDate, endDate, selectedShop])

//   const fetchAllData = async () => {
//     try {
//       setLoading(true)
//       const [salesRes, purchasesRes] = await Promise.all([
//         api.get("/sales", { params: { startDate, endDate, shopId: selectedShop } }),
//         api.get("/purchases", { params: { startDate, endDate, shopId: selectedShop } }),
//       ])
//       setSales(salesRes.data || [])
//       setPurchases(purchasesRes.data || [])
//     } catch (error) {
//       console.error("Error fetching data:", error)
//       setSales([])
//       setPurchases([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
//   const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0)

//   const handleEdit = (item, type) => {
//     setEditingItem({ ...item })
//     setEditType(type)
//   }

//   const handleSaveEdit = async () => {
//   try {
//     setSaving(true); // Start saving state
//     const endpoint =
//       editType === "sale"
//         ? `/sales/${editingItem.id}`
//         : `/purchases/${editingItem.id}`;

//     await api.put(endpoint, editingItem);

//     alert(`${editType === "sale" ? "Sale" : "Purchase"} updated successfully!`);
//     setEditingItem(null);
//     fetchAllData();
//   } catch (err) {
//     console.error("Error updating record:", err);
//     alert("Failed to update record");
//   } finally {
//     setSaving(false); 
//   }
// };


//   // if (loading) return <div className="loading">Loading...</div>

//    // 🔹 Show spinner while fetching data
//   if (loading) {
//     return (
//       <div className="modal-overlay">
//         <div className="loading-spinner-container">
//           <div className="spinner"></div>
//           <p>Loading fund details...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="all-shops-container">
//       <h1>All Shops Data</h1>

//       {/* Filters */}
//       <div className="filters-section">
//         <div className="date-filters">
//           <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//           <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//         </div>
//         <div className="shop-filter">
//           <label>Filter by Shop:</label>
//           <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)}>
//             <option value="all">All Shops</option>
//             <option value="shop1">Shop 1</option>
//             <option value="shop2">Shop 2</option>
//             <option value="shop3">Shop 3</option>
//           </select>
//         </div>
//       </div>

//       {/* Summary */}
//       <div className="summary-cards">
//         <div className="summary-card">
//           <h3>Total Sales</h3>
//           <p className="amount">₹{totalSales.toLocaleString()}</p>
//         </div>
//         <div className="summary-card">
//           <h3>Total Purchases</h3>
//           <p className="amount">₹{totalPurchases.toLocaleString()}</p>
//         </div>
//         <div className="summary-card">
//           <h3>Gross Profit</h3>
//           <p className="amount">₹{(totalSales - totalPurchases).toLocaleString()}</p>
//         </div>
//       </div>

//       {/* Sales Section */}
//       <div className="data-section">
//         <h2>Sales Transactions</h2>
//         {sales.length === 0 ? (
//           <p className="no-data">No Sale Details Found</p>
//         ) : (
//           <div className="table-wrapper">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Date</th>
//                   <th>Item</th>
//                   <th>Customer</th>
//                   <th>Worker</th>
//                   <th>Quantity</th>
//                   <th>Unit Price</th>
//                   <th>Total Amount</th>
//                   <th>Payment Type</th>
//                   <th>Borrow Amount</th>
//                   <th>Edit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {sales.map((sale) => (
//                   <tr key={sale.id}>
//                     <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
//                     <td>{sale.item?.name || "N/A"}</td>
//                     <td>{sale.customerName || "-"}</td>
//                     <td>{sale.user?.name || "-"}</td>
//                     <td>{sale.quantity}</td>
//                     <td>₹{sale.unitPrice.toLocaleString()}</td>
//                     <td>₹{sale.totalAmount.toLocaleString()}</td>
//                     <td>{sale.paymentType || "paid"}</td>
//                     <td>
//                       {sale.paymentType === "borrow" && sale.borrowAmount
//                         ? `₹${sale.borrowAmount}`
//                         : "-"}
//                     </td>
//                     <td>
//                       <button className="edit-btn" onClick={() => handleEdit(sale, "sale")}>
//                         ✏️ Edit
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Purchases Section */}
//       <div className="data-section">
//         <h2>Purchase Transactions</h2>
//         {purchases.length === 0 ? (
//           <p className="no-data">No Purchase Details Found</p>
//         ) : (
//           <div className="table-wrapper">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Date</th>
//                   <th>Item</th>
//                   <th>Supplier</th>
//                   <th>Worker</th>
//                   <th>Quantity</th>
//                   <th>Unit Price</th>
//                   <th>Total Amount</th>
//                   <th>Payment Type</th>
//                   <th>Borrow Amount</th>
//                   <th>Edit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {purchases.map((purchase) => (
//                   <tr key={purchase.id}>
//                     <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
//                     <td>{purchase.item?.name || "N/A"}</td>
//                     <td>{purchase.supplierName || "-"}</td>
//                     <td>{purchase.user?.name || "-"}</td>
//                     <td>{purchase.quantity}</td>
//                     <td>₹{purchase.unitPrice.toLocaleString()}</td>
//                     <td>₹{purchase.totalAmount.toLocaleString()}</td>
//                     <td>{purchase.paymentType || "paid"}</td>
//                     <td>
//                       {purchase.paymentType === "borrow" && purchase.borrowAmount
//                         ? `₹${purchase.borrowAmount}`
//                         : "-"}
//                     </td>
//                     <td>
//                       <button className="edit-btn" onClick={() => handleEdit(purchase, "purchase")}>
//                        ✏️ Edit
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Full Edit Modal */}
//       {editingItem && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <h3>Edit {editType === "sale" ? "Sale" : "Purchase"}</h3>
//             <div className="modal-form">
//               <label>Item Name:</label>
//               <input
//                 type="text"
//                 value={editingItem.item?.name || ""}
//                 onChange={(e) =>
//                   setEditingItem({
//                     ...editingItem,
//                     item: { ...editingItem.item, name: e.target.value },
//                   })
//                 }
//               />

//               <label>{editType === "sale" ? "Customer Name:" : "Supplier Name:"}</label>
//               <input
//                 type="text"
//                 value={
//                   editType === "sale"
//                     ? editingItem.customerName || ""
//                     : editingItem.supplierName || ""
//                 }
//                 onChange={(e) =>
//                   setEditingItem({
//                     ...editingItem,
//                     [editType === "sale" ? "customerName" : "supplierName"]: e.target.value,
//                   })
//                 }
//               />

//               <label>Contact:</label>
//               <input
//                 type="text"
//                 value={
//                   editType === "sale"
//                     ? editingItem.customerContact || ""
//                     : editingItem.supplierContact || ""
//                 }
//                 onChange={(e) =>
//                   setEditingItem({
//                     ...editingItem,
//                     [editType === "sale" ? "customerContact" : "supplierContact"]: e.target.value,
//                   })
//                 }
//               />

//               <label>Quantity:</label>
//               <input
//                 type="number"
//                 value={editingItem.quantity}
//                 onChange={(e) =>
//                   setEditingItem({ ...editingItem, quantity: Number(e.target.value) })
//                 }
//               />

//               <label>Unit Price:</label>
//               <input
//                 type="number"
//                 value={editingItem.unitPrice}
//                 onChange={(e) =>
//                   setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })
//                 }
//               />

//               <label>Total Amount:</label>
//               <input
//                 type="number"
//                 value={editingItem.totalAmount}
//                 onChange={(e) =>
//                   setEditingItem({ ...editingItem, totalAmount: Number(e.target.value) })
//                 }
//               />

//               <label>Payment Type:</label>
//               <select
//                 value={editingItem.paymentType || "paid"}
//                 onChange={(e) =>
//                   setEditingItem({ ...editingItem, paymentType: e.target.value })
//                 }
//               >
//                 <option value="paid">Paid</option>
//                 <option value="borrow">Borrow</option>
//               </select>

//               {editingItem.paymentType === "borrow" && (
//                 <>
//                   <label>Borrow Amount:</label>
//                   <input
//                     type="number"
//                     value={editingItem.borrowAmount || ""}
//                     onChange={(e) =>
//                       setEditingItem({
//                         ...editingItem,
//                         borrowAmount: Number(e.target.value),
//                       })
//                     }
//                   />
//                 </>
//               )}

//               <label>Date:</label>
//               <input
//                 type="date"
//                 value={
//                   editType === "sale"
//                     ? editingItem.saleDate?.split("T")[0]
//                     : editingItem.purchaseDate?.split("T")[0]
//                 }
//                 onChange={(e) =>
//                   setEditingItem({
//                     ...editingItem,
//                     [editType === "sale" ? "saleDate" : "purchaseDate"]: e.target.value,
//                   })
//                 }
//               />
//             </div>

//             <div className="modal-buttons">
//             <button onClick={handleSaveEdit} className="save-btn" disabled={saving}>
//               {saving ? "Saving..." : "Save"}
//             </button>
//             <button
//               onClick={() => setEditingItem(null)}
//               className="cancel-btn"
//               disabled={saving}
//             >
//               Cancel
//             </button>
//           </div>

//           </div>
//         </div>
//       )}

//     </div>
//   )
// }


import { useState, useEffect } from "react"
import api from "../utils/api"
import "../styles/AllShopsData.css"

export default function AllShopsData() {
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState("all")
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editType, setEditType] = useState("")
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])

  // Pagination states
  const [salesPage, setSalesPage] = useState(1)
  const [purchasePage, setPurchasePage] = useState(1)
  const itemsPerPage = 10 // adjustable

  useEffect(() => {
    fetchAllData()
  }, [startDate, endDate, selectedShop])

 const fetchAllData = async () => {
  try {
    setLoading(true)
    const [salesRes, purchasesRes] = await Promise.all([
      api.get("/sales", { params: { startDate, endDate, shopId: selectedShop } }),
      api.get("/purchases", { params: { startDate, endDate, shopId: selectedShop } }),
    ])

    // Make sure data is always an array
    setSales(Array.isArray(salesRes.data.data) ? salesRes.data.data : [])
    setPurchases(Array.isArray(purchasesRes.data.data) ? purchasesRes.data.data : [])

    setSalesPage(1)
    setPurchasePage(1)
  } catch (error) {
    console.error("Error fetching data:", error)
    setSales([])
    setPurchases([])
  } finally {
    setLoading(false)
  }
}


  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0)

  const handleEdit = (item, type) => {
    setEditingItem({ ...item })
    setEditType(type)
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      const endpoint =
        editType === "sale"
          ? `/sales/${editingItem.id}`
          : `/purchases/${editingItem.id}`
      await api.put(endpoint, editingItem)
      alert(`${editType === "sale" ? "Sale" : "Purchase"} updated successfully!`)
      setEditingItem(null)
      fetchAllData()
    } catch (err) {
      console.error("Error updating record:", err)
      alert("Failed to update record")
    } finally {
      setSaving(false)
    }
  }

  // Pagination logic
  const paginatedSales = sales.slice((salesPage - 1) * itemsPerPage, salesPage * itemsPerPage)
  const paginatedPurchases = purchases.slice(
    (purchasePage - 1) * itemsPerPage,
    purchasePage * itemsPerPage
  )

  const totalSalesPages = Math.ceil(sales.length / itemsPerPage)
  const totalPurchasePages = Math.ceil(purchases.length / itemsPerPage)

  // Loading spinner
  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="all-shops-container">
      <h1>All Shops Data</h1>

      {/* Filters */}
      <div className="filters-section">
        <div className="date-filters">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="shop-filter">
          <label>Filter by Shop:</label>
          <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)}>
            <option value="all">All Shops</option>
            <option value="shop1">Shop 1</option>
            <option value="shop2">Shop 2</option>
            <option value="shop3">Shop 3</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Sales</h3>
          <p className="amount">₹{totalSales.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Total Purchases</h3>
          <p className="amount">₹{totalPurchases.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Gross Profit</h3>
          <p className="amount">₹{(totalSales - totalPurchases).toLocaleString()}</p>
        </div>
      </div>

      {/* Sales Section */}
      <div className="data-section">
        <h2>Sales Transactions</h2>
        {sales.length === 0 ? (
          <p className="no-data">No Sale Details Found</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Customer</th>
                    <th>Worker</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Payment Type</th>
                    <th>Borrow Amount</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                      <td>{sale.item?.name || "N/A"}</td>
                      <td>{sale.customerName || "-"}</td>
                      <td>{sale.user?.name || "-"}</td>
                      <td>{sale.quantity}</td>
                      <td>₹{sale.unitPrice.toLocaleString()}</td>
                      <td>₹{sale.totalAmount.toLocaleString()}</td>
                      <td>{sale.paymentType || "paid"}</td>
                      <td>
                        {sale.paymentType === "borrow" && sale.borrowAmount
                          ? `₹${sale.borrowAmount}`
                          : "-"}
                      </td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEdit(sale, "sale")}>
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled={salesPage === 1} onClick={() => setSalesPage(salesPage - 1)}>
                Prev
              </button>
              <span>
                Page {salesPage} of {totalSalesPages}
              </span>
              <button
                disabled={salesPage === totalSalesPages}
                onClick={() => setSalesPage(salesPage + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Purchases Section */}
      <div className="data-section">
        <h2>Purchase Transactions</h2>
        {purchases.length === 0 ? (
          <p className="no-data">No Purchase Details Found</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Supplier</th>
                    <th>Worker</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Payment Type</th>
                    <th>Borrow Amount</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                      <td>{purchase.item?.name || "N/A"}</td>
                      <td>{purchase.supplierName || "-"}</td>
                      <td>{purchase.user?.name || "-"}</td>
                      <td>{purchase.quantity}</td>
                      <td>₹{purchase.unitPrice.toLocaleString()}</td>
                      <td>₹{purchase.totalAmount.toLocaleString()}</td>
                      <td>{purchase.paymentType || "paid"}</td>
                      <td>
                        {purchase.paymentType === "borrow" && purchase.borrowAmount
                          ? `₹${purchase.borrowAmount}`
                          : "-"}
                      </td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEdit(purchase, "purchase")}>
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled={purchasePage === 1} onClick={() => setPurchasePage(purchasePage - 1)}>
                Prev
              </button>
              <span>
                Page {purchasePage} of {totalPurchasePages}
              </span>
              <button
                disabled={purchasePage === totalPurchasePages}
                onClick={() => setPurchasePage(purchasePage + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit {editType === "sale" ? "Sale" : "Purchase"}</h3>
            <div className="modal-form">
              {/* Editable fields */}
              <label>Quantity:</label>
              <input
                type="number"
                value={editingItem.quantity}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, quantity: Number(e.target.value) })
                }
              />
              <label>Unit Price:</label>
              <input
                type="number"
                value={editingItem.unitPrice}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })
                }
              />
              <label>Total Amount:</label>
              <input
                type="number"
                value={editingItem.totalAmount}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, totalAmount: Number(e.target.value) })
                }
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleSaveEdit} className="save-btn" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingItem(null)} className="cancel-btn" disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
