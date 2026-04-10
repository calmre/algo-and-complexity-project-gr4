import React, { useState } from 'react'
import dayjs from 'dayjs'
import './CalendarView.css'

export default function CalendarView({ tasks, onToggle, onDelete }) {
  const [month, setMonth] = useState(dayjs())
  const [selected, setSelected] = useState(null)

  const startOfMonth = month.startOf('month')
  const daysInMonth = month.daysInMonth()
  const startDay = startOfMonth.day() // 0=Sun

  const tasksByDate = {}
  tasks.forEach(t => {
    if (!t.due_date) return
    const key = dayjs(t.due_date).format('YYYY-MM-DD')
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(t)
  })

  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedKey = selected ? month.date(selected).format('YYYY-MM-DD') : null
  const selectedTasks = selectedKey ? (tasksByDate[selectedKey] || []) : []

  return (
    <div className="calendar-wrap">
      <div className="cal-nav">
        <button onClick={() => setMonth(m => m.subtract(1, 'month'))}>‹</button>
        <span>{month.format('MMMM YYYY')}</span>
        <button onClick={() => setMonth(m => m.add(1, 'month'))}>›</button>
      </div>

      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal-cell empty" />
          const key = month.date(day).format('YYYY-MM-DD')
          const dayTasks = tasksByDate[key] || []
          const isToday = month.date(day).isSame(dayjs(), 'day')
          const isSelected = day === selected
          return (
            <div
              key={key}
              className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelected(day === selected ? null : day)}
            >
              <span className="cal-day-num">{day}</span>
              {dayTasks.length > 0 && (
                <div className="cal-dots">
                  {dayTasks.slice(0, 3).map(t => (
                    <span key={t.id} className={`cal-dot ${t.completed ? 'done' : ''}`} />
                  ))}
                  {dayTasks.length > 3 && <span className="cal-more">+{dayTasks.length - 3}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="cal-detail">
          <h3>{month.date(selected).format('dddd, MMMM D')}</h3>
          {selectedTasks.length === 0 ? (
            <p className="cal-no-tasks">No tasks this day.</p>
          ) : (
            <ul className="cal-task-list">
              {selectedTasks.map(t => (
                <li key={t.id} className={`cal-task-item ${t.completed ? 'done' : ''}`}>
                  <button className="task-check" onClick={() => onToggle(t)}>
                    {t.completed ? '✓' : ''}
                  </button>
                  <span>{t.title}</span>
                  <button className="task-delete" onClick={() => onDelete(t.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
