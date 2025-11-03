import { useState } from "react"
import ViewInventory from "./inventory/ViewInventory"
import ViewPurchases from "./inventory/ViewPurchases"
import ViewSales from "./inventory/ViewSales"
import "./InventoryTabs.css"

export default function InventoryTabs() {
  const [activeTab, setActiveTab] = useState("purchases")

  return (
    <div className="inventory-tabs">
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "purchases" ? "active" : ""}`}
          onClick={() => setActiveTab("purchases")}
        >
          Purchases
        </button>
        <button className={`tab-btn ${activeTab === "sales" ? "active" : ""}`} onClick={() => setActiveTab("sales")}>
          Sales
        </button>
          <button
          className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "inventory" && <ViewInventory />}
        {activeTab === "purchases" && <ViewPurchases />}
        {activeTab === "sales" && <ViewSales />}
      </div>
    </div>
  )
}
