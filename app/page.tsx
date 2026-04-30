'use client'

import { useState, useEffect, useRef } from 'react'

type Task = { id: string; title: string; category: string; priority: string; status: string; estimatedPomodoros: number; completedPomodoros: number; createdAt: string }
type Session = { id: string; taskId: string | null; type: string; startTime: string; endTime: string; status: string }
type Stat = { completedSessions: number; focusedMinutes: number }

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [stats, setStats] = useState<Stat>({ completedSessions: 0, focusedMinutes: 0 })
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)
  
  // New task form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Study')
  const [priority, setPriority] = useState('Medium')
  const [estimated, setEstimated] = useState('1')

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = async () => {
    const [tasksRes, sessionRes, statsRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/pomodoro'),
      fetch('/api/stats')
    ])
    const tasksData = await tasksRes.json()
    const sessionData = await sessionRes.json()
    const statsData = await statsRes.json()
    
    setTasks(tasksData)
    setSession(sessionData)
    setStats(statsData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (session && session.status === 'active') {
      const updateTimer = () => {
        const end = new Date(session.endTime).getTime()
        const now = new Date().getTime()
        const diff = Math.floor((end - now) / 1000)
        
        if (diff <= 0) {
          setTimeLeft(0)
          completeSession(session.id)
          if (timerRef.current) clearInterval(timerRef.current)
        } else {
          setTimeLeft(diff)
        }
      }
      
      updateTimer()
      timerRef.current = setInterval(updateTimer, 1000)
    } else {
      setTimeLeft(25 * 60) // Default 25 min
      if (timerRef.current) clearInterval(timerRef.current)
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [session])

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, priority, estimatedPomodoros: estimated })
    })
    setTitle('')
    fetchData()
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const startSession = async (type: string) => {
    if (type === 'focus' && !selectedTaskId) {
      alert("Please select a task to start focusing.")
      return
    }
    setCompletionMessage(null)
    await fetch('/api/pomodoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: selectedTaskId || null, type })
    })
    fetchData()
  }

  const completeSession = async (sessionId: string) => {
    await fetch('/api/pomodoro/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
    setSession(null)
    setCompletionMessage("Good. Take a break.")
    setTimeout(() => setCompletionMessage(null), 4000)
    fetchData()
  }

  const cancelSession = async () => {
    if (!session) return
    await fetch('/api/pomodoro/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id })
    })
    setSession(null)
    setCompletionMessage(null)
    setTimeLeft(25 * 60)
    if (timerRef.current) clearInterval(timerRef.current)
    fetchData()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const isFocusing = session !== null;

  useEffect(() => {
    if (isFocusing) {
      document.body.classList.add('focus-body');
    } else {
      document.body.classList.remove('focus-body');
    }
    return () => document.body.classList.remove('focus-body');
  }, [isFocusing]);

  return (
    <div className={`container ${isFocusing ? 'focus-mode-active' : ''}`}>
      {!isFocusing && (
        <header className="mb-4">
          <h1>Focus Dashboard</h1>
        </header>
      )}

      {completionMessage && (
        <div className="completion-message">
          {completionMessage}
        </div>
      )}

      <div className={isFocusing ? 'focus-grid' : 'dashboard-grid'}>
        <div className="main-content flex-col gap-4">
          
          <div className="card focus-card">
            <h2>{isFocusing ? 'Active Focus' : 'Current Task'}</h2>
            
            {!isFocusing ? (
              <select 
                className="input mt-4" 
                value={selectedTaskId} 
                onChange={e => setSelectedTaskId(e.target.value)}
              >
                <option value="">-- Select a task to focus on --</option>
                {tasks.filter(t => t.status !== 'completed').map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.completedPomodoros}/{t.estimatedPomodoros})</option>
                ))}
              </select>
            ) : (
              <div className="active-task-display mt-4">
                {tasks.find(t => t.id === session.taskId)?.title || 'Independent Focus'}
              </div>
            )}

            <div className="timer-display">
              {formatTime(timeLeft)}
            </div>

            <div className="flex justify-center gap-2">
              {!isFocusing ? (
                <>
                  <button className="btn btn-primary" onClick={() => startSession('focus')}>Start Focus (25m)</button>
                  <button className="btn btn-outline" onClick={() => startSession('short_break')}>Short Break (5m)</button>
                </>
              ) : (
                <button className="btn btn-outline" onClick={cancelSession}>Interrupt Session</button>
              )}
            </div>
          </div>

          {!isFocusing && (

          <div className="card">
            <h2>Tasks</h2>
            <form onSubmit={createTask} className="flex gap-2 mt-4 mb-4">
              <input className="input" placeholder="Task title..." value={title} onChange={e => setTitle(e.target.value)} />
              <select className="input" style={{ width: 'auto' }} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <input type="number" className="input" style={{ width: '80px' }} min="1" value={estimated} onChange={e => setEstimated(e.target.value)} />
              <button type="submit" className="btn btn-primary">Add</button>
            </form>

            <div className="task-list">
              {tasks.map(task => (
                <div key={task.id} className="task-item">
                  <div>
                    <div className="task-title" style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    <div className="task-meta">
                      <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <span>• {task.category}</span>
                      <span>• {task.completedPomodoros} / {task.estimatedPomodoros} sessions</span>
                    </div>
                  </div>
                  <button className="btn btn-outline" onClick={() => deleteTask(task.id)}>Delete</button>
                </div>
              ))}
              {tasks.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No tasks found. Add one above.</p>}
            </div>
          </div>
          )}
        </div>

        {!isFocusing && (
          <div className="sidebar flex-col gap-4">
            <div className="card">
              <h2>Daily Stats</h2>
              <div className="stats-grid mt-4">
                <div className="stat-box">
                  <div className="stat-value">{stats.completedSessions}</div>
                  <div className="stat-label">Sessions</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{stats.focusedMinutes}</div>
                  <div className="stat-label">Minutes</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
