import React from 'react'
import dayjs from 'dayjs'
import './TaskList.css'

const CATEGORY_COLORS = {
  Work:     '#6c5ce7',
  Personal: '#00b894',
  Health:   '#e17055',
  Shopping: '#fdcb6e',
  General:  '#636e72',
}

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#6c5ce7'
}

export default function TaskList({ tasks, onToggle, onDelete }) {
  if (!tasks.length) {
    return <div className="empty-state">No tasks here. Add one with the + button.</div>
  }

  return (
    <ul className="task-list">
      {tasks.map(task => (
        <li key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
          <button className="task-check" onClick={() => onToggle(task)} aria-label="Toggle complete">
            {task.completed ? '✓' : ''}
          </button>
          <div className="task-body">
            <div className="task-title-row">
              <span className="task-title">{task.title}</span>
              <span
                className="task-category"
                style={{ background: categoryColor(task.category) + '22', color: categoryColor(task.category) }}
              >
                {task.category}
              </span>
            </div>
            {task.description && <span className="task-desc">{task.description}</span>}
            {task.due_date && (
              <span className="task-date">{dayjs(task.due_date).format('MMM D, h:mm A')}</span>
            )}
          </div>
          <button className="task-delete" onClick={() => onDelete(task.id)} aria-label="Delete task">✕</button>
        </li>
      ))}
    </ul>
  )
}
