"use client"

import { X } from "lucide-react"
import "./ImageModal.css"

export default function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <img src={imageUrl} alt="Full view" className="image-modal-img" />
      </div>
    </div>
  )
}

