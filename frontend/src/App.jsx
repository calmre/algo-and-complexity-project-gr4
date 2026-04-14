import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import TaskList from './components/TaskList'
import CalendarView from './components/CalendarView'
import FloatingButton from './components/FloatingButton'
import AddTaskModal from './components/AddTaskModal'
import Login from './components/Login'
import { getTasks, getAllTasks, updateTask, deleteTask, getCategories } from './api'
import { linearFilterByCategory, mergeSort, binarySearchByTitle, fuzzySearch } from './algorithms'
import './App.css'

const VIEWS = ['day', 'week', 'month']
const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'title',    label: 'Title' },
]

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [timeView, setTimeView] = useState('day')
  const [displayMode, setDisplayMode] = useState('list')
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Filter / sort / search state
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('due_date')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTasks = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = displayMode === 'calendar'
        ? await getAllTasks()
        : await getTasks(timeView, currentDate.toDate())
      setTasks(data)
    } catch (err) {
      if (err.response?.status === 401) handleLogout()
    } finally {
      setLoading(false)
    }
  }, [timeView, currentDate, displayMode, token])

  useEffect(() => {
    if (token) fetchTasks()
  }, [fetchTasks, token])

  useEffect(() => {
    if (token) getCategories().then(setCategories)
  }, [token])

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setTasks([])
  }

  // Apply algorithms in sequence: linear filter → merge sort → binary/fuzzy search
  const processedTasks = useMemo(() => {
    // 1. Linear search: filter by category
    let result = linearFilterByCategory(tasks, activeCategory)

    // 2. Merge sort: sort by chosen key
    result = mergeSort(result, sortKey)

    // 3. Search: binary search for exact match, fallback to fuzzy for partial
    if (searchQuery.trim()) {
      const exact = binarySearchByTitle(result, searchQuery)
      result = exact.length > 0 ? exact : fuzzySearch(result, searchQuery)
    }

    return result
  }, [tasks, activeCategory, sortKey, searchQuery])

  const handleToggle = async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed })
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const handleDelete = async (id) => {
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const navigate = (dir) => {
    const unit = timeView === 'day' ? 'day' : timeView === 'week' ? 'week' : 'month'
    setCurrentDate(prev => dir === 'next' ? prev.add(1, unit) : prev.subtract(1, unit))
  }

  const dateLabel = () => {
    if (timeView === 'day') return currentDate.format('dddd, MMMM D YYYY')
    if (timeView === 'week') {
      const start = currentDate.startOf('week')
      const end = currentDate.endOf('week')
      return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`
    }
    return currentDate.format('MMMM YYYY')
  }

  if (!token) {
    return <Login setAuthAction={handleLogin} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tasks</h1>
        <div className="header-controls">
          <div className="display-toggle">
            <button className={displayMode === 'list' ? 'active' : ''} onClick={() => setDisplayMode('list')}>List</button>
            <button className={displayMode === 'calendar' ? 'active' : ''} onClick={() => setDisplayMode('calendar')}>Calendar</button>
          </div>
          {displayMode === 'list' && (
            <div className="time-toggle">
              {VIEWS.map(v => (
                <button key={v} className={timeView === v ? 'active' : ''} onClick={() => setTimeView(v)}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      {/* Search + Filter + Sort toolbar */}
      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search tasks"
        />
        <div className="toolbar-right">
          <select
            className="toolbar-select"
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="toolbar-select"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
          </select>
        </div>
      </div>

      {displayMode === 'list' && (
        <div className="date-nav">
          <button onClick={() => navigate('prev')}>‹</button>
          <span>{dateLabel()}</span>
          <button onClick={() => navigate('next')}>›</button>
        </div>
      )}

      <main className="app-main">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : displayMode === 'list' ? (
          <TaskList tasks={processedTasks} onToggle={handleToggle} onDelete={handleDelete} />
        ) : (
          <CalendarView tasks={processedTasks} onToggle={handleToggle} onDelete={handleDelete} />
        )}
      </main>

      <FloatingButton onOpen={() => setShowModal(true)} />

      {showModal && (
        <AddTaskModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            fetchTasks()
            getCategories().then(setCategories)
          }}
        />
      )}
    </div>
  )
}
