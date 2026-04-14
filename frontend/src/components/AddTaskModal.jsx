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

  // Date confirm dialog state
  const [showDateConfirm, setShowDateConfirm] = useState(false)
  const [pendingDate, setPendingDate] = useState('')

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
      console.log('[Voice] MediaRecorder started | mimeType:', recorder.mimeType)
      mediaRef.current = recorder
      recorder.ondataavailable = e => {
        console.log('[Voice] Data chunk received:', e.data.size, 'bytes')
        chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setVoiceStatus('Processing...')
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        console.log('[Voice] Blob size:', blob.size, 'bytes | type:', blob.type)
        try {
          const result = await transcribeVoice(blob)
          console.log('[Voice] Raw API response:', result)
          console.log('[Voice] transcript:', result.transcript)
          console.log('[Voice] parsed title:', result.title)
          console.log('[Voice] parsed due_date:', result.due_date)
          setTitle(result.title || result.transcript)
          if (result.due_date) {
            const d = new Date(result.due_date)
            setDueDate(d.toISOString().slice(0, 16))
          }
          setVoiceStatus(`Heard: "${result.transcript}"`)
        } catch (err) {
          console.error('[Voice] Request failed:', err)
          // Try to extract the backend error detail
          if (err?.response) {
            const body = err.response.data
            console.error('[Voice] Backend status:', err.response.status)
            console.error('[Voice] Backend detail:', body?.detail ?? body)
          } else {
            console.error('[Voice] No response — possible network or CORS issue')
          }
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
    console.log('[Voice] Stopping recording, chunks so far:', chunksRef.current.length)
    mediaRef.current?.stop()
    setRecording(false)
  }

  // Open the confirm dialog pre-filled with current value (or now)
  const openDateConfirm = () => {
    const initial = dueDate || new Date().toISOString().slice(0, 16)
    setPendingDate(initial)
    setShowDateConfirm(true)
  }

  const confirmDate = () => {
    setDueDate(pendingDate)
    setShowDateConfirm(false)
  }

  const cancelDate = () => {
    setShowDateConfirm(false)
  }

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" role="dialog" aria-modal="true" aria-label="Add task">
          <div className="modal-header">
            <h2>New Task</h2>
            <div className="modal-header-actions">
              <button
                type="button"
                className={`mic-btn ${recording ? 'recording' : ''}`}
                onClick={recording ? stopRecording : startRecording}
                aria-label={recording ? 'Stop recording' : 'Voice input'}
                title={recording ? 'Stop recording' : 'Voice input'}
              >
                {recording ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 9a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V23h-2v-2.06A9 9 0 0 1 3 12h2z"/>
                  </svg>
                )}
              </button>
              <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
          </div>

          {voiceStatus && <div className="voice-status">{voiceStatus}</div>}

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
              <div className="due-date-row">
                <input
                  type="text"
                  readOnly
                  value={dueDate ? new Date(dueDate).toLocaleString() : ''}
                  placeholder="Click to set a due date..."
                  onClick={openDateConfirm}
                  style={{ cursor: 'pointer' }}
                />
                {dueDate && (
                  <button type="button" className="due-date-clear" onClick={() => setDueDate('')}>
                    Clear
                  </button>
                )}
              </div>
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

      {showDateConfirm && (
        <div className="date-confirm-overlay">
          <div className="date-confirm-box" role="dialog" aria-label="Pick due date">
            <p>Due Date</p>
            <input
              type="datetime-local"
              value={pendingDate}
              onChange={e => setPendingDate(e.target.value)}
              autoFocus
            />
            <div className="date-confirm-actions">
              <button className="btn-cancel" onClick={cancelDate}>Cancel</button>
              <button className="btn-ok" onClick={confirmDate}>OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
