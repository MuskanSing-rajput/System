import React from "react"
import "./Pagination.css"

export default function Pagination({ totalItems, pageSize = 10, currentPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalPages === 1) return null

  const makeRange = () => {
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    if (start > 1) pages.unshift("...")
    if (end < totalPages) pages.push("...")
    return pages
  }

  const pages = makeRange()

  return (
    <div className="pagination">
      <button
        className="page-btn"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Prev
      </button>

      {pages.map((p, idx) => (
        <button
          key={`${p}-${idx}`}
          className={`page-btn ${p === currentPage ? "active" : ""} ${p === "..." ? "dots" : ""}`}
          onClick={() => typeof p === "number" && onPageChange(p)}
          disabled={p === "..."}
        >
          {p}
        </button>
      ))}

      <button
        className="page-btn"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  )
}
