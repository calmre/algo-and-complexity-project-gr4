import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import TaskList from './components/TaskList'
import CalendarView from './components/CalendarView'
import FloatingButton from './components/FloatingButton'
import AddTaskModal from './components/AddTaskModal'
import { getTasks, getAllTasks, updateTask, deleteTask, getCategories } from './api'
import { linearFilterByCategory, mergeSort, binarySearchByTitle, fuzzySearch } from './algorithms'
import './App.css'

const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'title',    label: 'Title' },
]

export default function App() {
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [displayMode, setDisplayMode] = useState('list')
  const [currentDate] = useState(dayjs())
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [taskFilter, setTaskFilter] = useState('upcoming') // 'upcoming' | 'past'

  // Filter / sort / search state
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('due_date')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const data = displayMode === 'calendar'
        ? await getAllTasks()
        : await getTasks('day', currentDate.toDate())
      setTasks(data)
    } finally {
      setLoading(false)
    }
  }, [currentDate, displayMode])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { getCategories().then(setCategories) }, [])

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

  // Split today's tasks into upcoming and past based on due_date vs now
  const now = dayjs()
  const upcomingTasks = useMemo(
    () => processedTasks.filter(t => !t.due_date || dayjs(t.due_date).isAfter(now)),
    [processedTasks]
  )
  const pastTasks = useMemo(
    () => processedTasks.filter(t => t.due_date && !dayjs(t.due_date).isAfter(now)),
    [processedTasks]
  )

  const hasUpcoming = upcomingTasks.length > 0
  const hasPast = pastTasks.length > 0
  const visibleTasks = taskFilter === 'upcoming' ? upcomingTasks : pastTasks

  // Auto-switch to the side that has tasks if current side is empty
  useEffect(() => {
    if (displayMode !== 'list') return
    if (taskFilter === 'upcoming' && !hasUpcoming && hasPast) setTaskFilter('past')
    if (taskFilter === 'past' && !hasPast && hasUpcoming) setTaskFilter('upcoming')
  }, [hasUpcoming, hasPast, taskFilter, displayMode])

  const handleToggle = async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed })
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const handleDelete = async (id) => {
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
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
              <button
                className={taskFilter === 'upcoming' ? 'active' : ''}
                onClick={() => setTaskFilter('upcoming')}
                disabled={!hasUpcoming}
              >
                Upcoming
              </button>
              <button
                className={taskFilter === 'past' ? 'active' : ''}
                onClick={() => setTaskFilter('past')}
                disabled={!hasPast}
              >
                Past
              </button>
            </div>
          )}
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
          <span>{currentDate.format('dddd, MMMM D YYYY')}</span>
        </div>
      )}

      <main className="app-main">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : displayMode === 'list' ? (
          visibleTasks.length > 0
            ? <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
            : <div className="empty-state">No {taskFilter} tasks for today.</div>
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
