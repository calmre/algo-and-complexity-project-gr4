import React, { useState, useRef } from 'react'
import { createTask, transcribeVoice } from '../api'
import './AddTaskModal.css'

export default function AddTaskModal({ onClose, onCreated, categories = [] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [dueDate, setDueDate] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      })
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  const startRecording = async () => {
    setVoiceStatus('Listening...')
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRef.current = recorder
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setVoiceStatus('Processing...')
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        try {
          const result = await transcribeVoice(blob)
          setTitle(result.title || result.transcript)
          if (result.due_date) {
            // Format for datetime-local input
            const d = new Date(result.due_date)
            setDueDate(d.toISOString().slice(0, 16))
          }
          setVoiceStatus(`Heard: "${result.transcript}"`)
        } catch {
          setVoiceStatus('Could not understand. Try again.')
        }
      }
      recorder.start()
      setRecording(true)
    } catch {
      setVoiceStatus('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add task">
        <div className="modal-header">
          <h2>New Task</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="voice-section">
          <button
            type="button"
            className={`voice-btn ${recording ? 'recording' : ''}`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? '⏹ Stop' : '🎤 Voice Input'}
          </button>
          {voiceStatus && <span className="voice-status">{voiceStatus}</span>}
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {(categories.length ? categories : ['General','Work','Personal','Health','Shopping']).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Due Date
            <input
              type="datetime-local"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
