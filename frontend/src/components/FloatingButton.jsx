import React from 'react'
import './FloatingButton.css'

export default function FloatingButton({ onOpen }) {
  return (
    <button className="fab" onClick={onOpen} aria-label="Add task">
      <span>+</span>
    </button>
  )
}
