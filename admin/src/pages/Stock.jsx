import { useState, useEffect } from "react";
import api from "../utils/api";
import Pagination from "../components/Pagination";
import "../styles/Stock.css";

export default function Stock() {
  const [items, setItems] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedShop]);

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get("/workers");
      setWorkers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedShop && selectedShop !== "all") params.append("shopId", selectedShop);

      const { data } = await api.get(`/items?${params.toString()}`);
      const itemsArr = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setItems(itemsArr);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // derive unique shop ids
  const shopOptions = [];
  const _seen = new Set();
  workers.forEach((w) => {
    const sid = w.user?.shopId || w.shopId;
    if (sid && !_seen.has(sid)) {
      _seen.add(sid);
      shopOptions.push(sid);
    }
  });

  return (
    <div className="stock-page">
      <div className="page-header">
        <div>
          <h1>Stock Overview</h1>
          <p>View item stock across shops</p>
        </div>
      </div>

      <div className="filters">
        <label>
          <span>Filter by Shop:</span>
          <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)}>
            <option value="all">All Shops</option>
            {shopOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="loading">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No items found</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  {/* <th>Min Stock</th> */}
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.slice((page - 1) * pageSize, page * pageSize).map((it) => (
                  <tr key={it.id}>
                    <td>{it.user?.shopId || '-'}</td>
                    <td><strong>{it.name}</strong></td>
                    <td>{it.stock}</td>
                    <td>{it.unit || 'kg'}</td>
                    {/* <td>{it.minStock}</td> */}
                    <td>{new Date(it.updatedAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination totalItems={items.length} pageSize={pageSize} currentPage={page} onPageChange={(p) => setPage(p)} />
        </>
      )}
    </div>
  );
}
