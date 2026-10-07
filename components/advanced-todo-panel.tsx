"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Filter,
  Star,
  StarOff,
  Mic,
  MicOff,
  Calendar,
  Image,
  Paperclip,
  Trash2,
  Archive,
  MoreHorizontal,
  DragHandleDots2,
  X,
  Target,
  Clock,
  Tag,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Download,
  Upload,
  RotateCcw,
  Palette,
  Sun,
  Moon,
  Settings,
  BarChart3,
  TrendingUp,
  PieChart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import BackgroundSettings from "./background-settings"

// Types
interface TodoItem {
  id: string
  title: string
  description?: string
  completed: boolean
  starred: boolean
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  boardId: string
  subtasks: SubTask[]
  attachments: Attachment[]
  linkedInvoiceId?: string
  color?: string
  status: 'todo' | 'in-progress' | 'done' | 'blocked'
  assignedTo?: {
    name: string
    email: string
    phone?: string
  }
  estimatedHours?: number
  actualHours?: number
  project?: string
  calendarEventId?: string
}

interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface Attachment {
  id: string
  name: string
  type: 'image' | 'file' | 'document' | 'video' | 'audio'
  url: string
  size?: number
  uploadedAt: Date
  mimeType?: string
}

interface TodoBoard {
  id: string
  title: string
  color: string
  todos: TodoItem[]
  createdAt: Date
}

interface AdvancedTodoPanelProps {
  isOpen: boolean
  onClose: () => void
  invoiceContext?: {
    invoiceId: string
    invoiceNumber: string
    clientName: string
  }
}

interface BackgroundSettings {
  type: 'none' | 'gradient' | 'image'
  value: string
  opacity: number
}

// Helper function to get storage data
const getStorageData = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

// Helper function to save to storage
const saveToStorage = (key: string, data: any) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export default function AdvancedTodoPanel({ isOpen, onClose, invoiceContext }: AdvancedTodoPanelProps) {
  // State management
  const [boards, setBoards] = useState<TodoBoard[]>([])
  const [activeBoard, setActiveBoard] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'completed' | 'pending' | 'starred' | 'today' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'dueDate'>('created')
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'grid'>('list')
  const [darkMode, setDarkMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedTodos, setSelectedTodos] = useState<string[]>([])
  const [showRecycleBin, setShowRecycleBin] = useState(false)
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({ type: 'none', value: '', opacity: 0.1 })
  const [analytics, setAnalytics] = useState({ productivity: 0, streakDays: 0, weeklyProgress: [] })
  const [showTaskCreator, setShowTaskCreator] = useState(false)
  const [editingTodo, setEditingTodo] = useState<string | null>(null)
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const newTodoInputRef = useRef<HTMLInputElement>(null)

  // Initialize data on mount
  useEffect(() => {
    const savedBoards = getStorageData('todo-boards', [])
    const savedBgSettings = getStorageData('todo-background', { type: 'none', value: '', opacity: 0.1 })
    setBackgroundSettings(savedBgSettings)
    if (savedBoards.length === 0) {
      // Create default boards
      const defaultBoards: TodoBoard[] = [
        {
          id: 'personal',
          title: 'Personal Tasks',
          color: '#3B82F6',
          todos: [],
          createdAt: new Date(),
        },
        {
          id: 'work',
          title: 'Work Tasks',
          color: '#10B981',
          todos: [],
          createdAt: new Date(),
        },
        {
          id: 'invoices',
          title: 'Invoice Tasks',
          color: '#F59E0B',
          todos: [],
          createdAt: new Date(),
        }
      ]
      setBoards(defaultBoards)
      setActiveBoard('personal')
      saveToStorage('todo-boards', defaultBoards)
    } else {
      setBoards(savedBoards)
      setActiveBoard(savedBoards[0]?.id || 'personal')
    }

    setDarkMode(getStorageData('todo-dark-mode', false))
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
    }
  }, [])

  // Save boards to storage whenever they change
  useEffect(() => {
    if (boards.length > 0) {
      saveToStorage('todo-boards', boards)
    }
  }, [boards])

  // Save dark mode preference
  useEffect(() => {
    saveToStorage('todo-dark-mode', darkMode)
  }, [darkMode])

  // Save background settings
  useEffect(() => {
    saveToStorage('todo-background', backgroundSettings)
  }, [backgroundSettings])

  // Helper functions
  const getActiveBoard = () => boards.find(board => board.id === activeBoard)

  const addTodo = (title: string, boardId?: string, taskData?: Partial<TodoItem>) => {
    if (!title.trim()) return

    const targetBoardId = boardId || activeBoard
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      title: title.trim(),
      description: taskData?.description || '',
      completed: false,
      starred: false,
      priority: taskData?.priority || 'medium',
      tags: taskData?.tags || [],
      dueDate: taskData?.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      boardId: targetBoardId,
      subtasks: taskData?.subtasks || [],
      attachments: taskData?.attachments || [],
      linkedInvoiceId: invoiceContext?.invoiceId,
      status: taskData?.status || 'todo',
      assignedTo: taskData?.assignedTo,
      estimatedHours: taskData?.estimatedHours,
      actualHours: taskData?.actualHours,
      project: taskData?.project,
      calendarEventId: taskData?.calendarEventId,
      color: taskData?.color,
    }

    setBoards(prevBoards => 
      prevBoards.map(board => 
        board.id === targetBoardId 
          ? { ...board, todos: [newTodo, ...board.todos] }
          : board
      )
    )

    // Clear input
    if (newTodoInputRef.current) {
      newTodoInputRef.current.value = ''
    }
  }

  const toggleTodo = (todoId: string) => {
    setBoards(prevBoards => 
      prevBoards.map(board => ({
        ...board,
        todos: board.todos.map(todo => 
          todo.id === todoId 
            ? { ...todo, completed: !todo.completed, updatedAt: new Date() }
            : todo
        )
      }))
    )
  }

  const toggleStar = (todoId: string) => {
    setBoards(prevBoards => 
      prevBoards.map(board => ({
        ...board,
        todos: board.todos.map(todo => 
          todo.id === todoId 
            ? { ...todo, starred: !todo.starred, updatedAt: new Date() }
            : todo
        )
      }))
    )
  }

  const deleteTodo = (todoId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setBoards(prevBoards => 
        prevBoards.map(board => ({
          ...board,
          todos: board.todos.filter(todo => todo.id !== todoId)
        }))
      )
    }
  }

  const startVoiceRecognition = () => {
    if (!recognitionRef.current) return

    setIsListening(true)
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
      if (event.results[event.results.length - 1].isFinal) {
        addTodo(transcript)
        setIsListening(false)
      }
    }

    recognitionRef.current.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current.start()
  }

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  // Speech to text for marking complete
  const speakTask = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      speechSynthesis.speak(utterance)
    }
  }

  // Filter and sort todos
  const getFilteredTodos = () => {
    const currentBoard = getActiveBoard()
    if (!currentBoard) return []

    let filtered = currentBoard.todos.filter(todo => {
      // Search filter
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter
      let matchesFilter = true
      switch (filterBy) {
        case 'completed':
          matchesFilter = todo.completed
          break
        case 'pending':
          matchesFilter = !todo.completed
          break
        case 'starred':
          matchesFilter = todo.starred
          break
        case 'today':
          matchesFilter = todo.dueDate ? 
            new Date(todo.dueDate).toDateString() === new Date().toDateString() : false
          break
        case 'overdue':
          matchesFilter = todo.dueDate ? 
            new Date(todo.dueDate) < new Date() && !todo.completed : false
          break
      }

      return matchesSearch && matchesFilter
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    // Starred items go to top
    return filtered.sort((a, b) => {
      if (a.starred && !b.starred) return -1
      if (!a.starred && b.starred) return 1
      return 0
    })
  }

  // Progress calculation
  const getProgress = () => {
    const currentBoard = getActiveBoard()
    if (!currentBoard || currentBoard.todos.length === 0) return 0
    
    const completed = currentBoard.todos.filter(todo => todo.completed).length
    return Math.round((completed / currentBoard.todos.length) * 100)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (!isOpen) return null

  const currentBoard = getActiveBoard()
  const filteredTodos = getFilteredTodos()
  const progress = getProgress()

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        darkMode && "dark"
      )}
      onClick={(e) => {
        // Close when clicking on the background overlay
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-4xl bg-background border-l shadow-2xl overflow-hidden"
        style={{
          backgroundImage: backgroundSettings.type === 'gradient' ? backgroundSettings.value :
                         backgroundSettings.type === 'image' ? `url(${backgroundSettings.value})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Background overlay */}
        {backgroundSettings.type !== 'none' && (
          <div 
            className="absolute inset-0 bg-background"
            style={{ opacity: 1 - backgroundSettings.opacity }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary via-accent to-primary/90 text-white p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">Smart Todo Manager</h1>
                <p className="text-blue-100 text-sm">
                  {invoiceContext ? `Linked to ${invoiceContext.invoiceNumber}` : 'Advanced task management'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-white hover:bg-white/20"
                title="Background Settings"
              >
                <Palette className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="text-white hover:bg-white/20"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-blue-100">
            {progress}% complete • {filteredTodos.filter(t => t.completed).length} of {filteredTodos.length} tasks done
          </div>
        </div>

        {/* Board Tabs */}
        <div className="flex gap-1 p-2 bg-muted/50 border-b overflow-x-auto">
          {boards.map(board => (
            <button
              key={board.id}
              onClick={() => setActiveBoard(board.id)}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all",
                activeBoard === board.id 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-background/50"
              )}
              style={{
                borderLeft: activeBoard === board.id ? `4px solid ${board.color}` : undefined
              }}
            >
              {board.title}
              <Badge variant="secondary" className="ml-2 text-xs">
                {board.todos.length}
              </Badge>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-card">
          {/* Search and Voice Input */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={newTodoInputRef}
                placeholder={invoiceContext ? `Add task for ${invoiceContext.invoiceNumber}...` : "Add new task..."}
                className="pl-10 pr-12"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTodo((e.target as HTMLInputElement).value)
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
                onClick={() => addTodo(newTodoInputRef.current?.value || '')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              disabled={!recognitionRef.current}
              className={cn(isListening && "animate-pulse")}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks, tags, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters and View Controls */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm bg-background"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="starred">Starred</option>
                <option value="today">Due Today</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm bg-background"
              >
                <option value="created">Created Date</option>
                <option value="updated">Updated Date</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
              </select>
            </div>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                Board
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'kanban' ? (
            <KanbanBoard todos={filteredTodos} onTodoUpdate={setBoards} boards={boards} />
          ) : (
            <div className="p-4">
              {filteredTodos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                  <p className="text-sm mb-4">
                    {searchTerm ? 'Try adjusting your search or filters' : 'Add your first task to get started'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowTaskCreator(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  )}
                </div>
              ) : (
                <div className={cn(
                  "space-y-2",
                  viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0"
                )}>
                  {filteredTodos.map((todo, index) => (
                    <TaskCard
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onToggleStar={toggleStar}
                      onDelete={deleteTodo}
                      onSpeak={speakTask}
                      onEdit={setEditingTodo}
                      draggedTodo={draggedTodo}
                      onDragStart={() => setDraggedTodo(todo.id)}
                      onDragEnd={() => setDraggedTodo(null)}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="border-t bg-card p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{progress}% Complete</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>{filteredTodos.length} Tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{filteredTodos.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length} Overdue</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs p-1">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button variant="ghost" size="sm" className="text-xs p-1">
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Background Settings Dialog */}
      <BackgroundSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={backgroundSettings}
        onSettingsChange={setBackgroundSettings}
      />
    </div>
  )
}

// TaskCard Component
interface TaskCardProps {
  todo: TodoItem
  onToggle: (id: string) => void
  onToggleStar: (id: string) => void
  onDelete: (id: string) => void
  onSpeak: (text: string) => void
  onEdit: (id: string) => void
  draggedTodo: string | null
  onDragStart: () => void
  onDragEnd: () => void
  getPriorityColor: (priority: string) => string
}

function TaskCard({ todo, onToggle, onToggleStar, onDelete, onSpeak, onEdit, draggedTodo, onDragStart, onDragEnd, getPriorityColor }: TaskCardProps) {
  return (
    <div
      className={cn(
        "group p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-200",
        todo.completed && "opacity-75 bg-muted/50",
        todo.starred && "ring-2 ring-yellow-200 bg-yellow-50/50",
        todo.color && `border-l-4`,
        draggedTodo === todo.id && "opacity-50 scale-95"
      )}
      style={{
        borderLeftColor: todo.color || (todo.starred ? '#FCD34D' : undefined)
      }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {todo.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title and Star */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className={cn(
              "font-medium text-sm",
              todo.completed && "line-through text-muted-foreground"
            )}>
              {todo.title}
            </h3>
            <button
              onClick={() => onToggleStar(todo.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {todo.starred ? (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Description */}
          {todo.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {todo.description}
            </p>
          )}

          {/* Tags */}
          {todo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {todo.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Assigned To */}
          {todo.assignedTo && (
            <div className="flex items-center gap-1 mb-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                {todo.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground">{todo.assignedTo.name}</span>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {/* Status */}
            <Badge variant={todo.status === 'done' ? 'default' : 'secondary'} className="text-xs">
              {todo.status.replace('-', ' ')}
            </Badge>

            {/* Priority */}
            <Badge className={cn("text-xs", getPriorityColor(todo.priority))}>
              {todo.priority}
            </Badge>

            {/* Due date */}
            {todo.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className={cn(
                  new Date(todo.dueDate) < new Date() && !todo.completed && "text-red-600"
                )}>
                  {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Attachments */}
            {todo.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span>{todo.attachments.length}</span>
              </div>
            )}

            {/* Subtasks */}
            {todo.subtasks.length > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{todo.subtasks.filter(st => st.completed).length}/{todo.subtasks.length}</span>
              </div>
            )}

            {/* Time tracking */}
            {(todo.estimatedHours || todo.actualHours) && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{todo.actualHours || 0}h/{todo.estimatedHours || 0}h</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            onClick={() => onSpeak(todo.title)}
          >
            <Volume2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            onClick={() => onEdit(todo.id)}
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-red-600 hover:text-red-800"
            onClick={() => onDelete(todo.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Subtasks */}
      {todo.subtasks.length > 0 && (
        <div className="mt-3 pl-8 space-y-1">
          {todo.subtasks.map(subtask => (
            <div key={subtask.id} className="flex items-center gap-2 text-xs">
              <Circle className="w-3 h-3 text-muted-foreground" />
              <span className={cn(
                subtask.completed && "line-through text-muted-foreground"
              )}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// KanbanBoard Component
interface KanbanBoardProps {
  todos: TodoItem[]
  onTodoUpdate: (boards: TodoBoard[]) => void
  boards: TodoBoard[]
}

function KanbanBoard({ todos, onTodoUpdate, boards }: KanbanBoardProps) {
  const columns = [
    { id: 'todo', title: 'To Do', color: '#3B82F6' },
    { id: 'in-progress', title: 'In Progress', color: '#F59E0B' },
    { id: 'done', title: 'Done', color: '#10B981' },
    { id: 'blocked', title: 'Blocked', color: '#EF4444' }
  ]

  const getTodosByStatus = (status: string) => {
    return todos.filter(todo => todo.status === status)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const todoId = e.dataTransfer.getData('text/plain')
    
    // Update todo status
    onTodoUpdate(boards.map(board => ({
      ...board,
      todos: board.todos.map(todo => 
        todo.id === todoId 
          ? { ...todo, status: status as TodoItem['status'], updatedAt: new Date() }
          : todo
      )
    })))
  }

  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        {columns.map(column => {
          const columnTodos = getTodosByStatus(column.id)
          return (
            <div
              key={column.id}
              className="bg-muted/20 rounded-lg p-3 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="font-medium text-sm">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnTodos.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {columnTodos.map(todo => (
                  <div
                    key={todo.id}
                    className="p-3 bg-card border rounded-lg cursor-move hover:shadow-sm transition-all"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', todo.id)
                    }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className={cn(
                          "text-sm font-medium mb-1",
                          todo.completed && "line-through text-muted-foreground"
                        )}>
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {todo.description}
                          </p>
                        )}
                      </div>
                      {todo.starred && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Assignee */}
                    {todo.assignedTo && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                          {todo.assignedTo.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground">{todo.assignedTo.name}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {todo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {todo.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {todo.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{todo.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {/* Priority */}
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          todo.priority === 'high' && "bg-red-500",
                          todo.priority === 'medium' && "bg-yellow-500",
                          todo.priority === 'low' && "bg-green-500"
                        )} />
                        
                        {/* Subtasks */}
                        {todo.subtasks.length > 0 && (
                          <span>{todo.subtasks.filter(st => st.completed).length}/{todo.subtasks.length}</span>
                        )}
                        
                        {/* Attachments */}
                        {todo.attachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{todo.attachments.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Due date */}
                      {todo.dueDate && (
                        <div className={cn(
                          "flex items-center gap-1",
                          new Date(todo.dueDate) < new Date() && !todo.completed && "text-red-600"
                        )}>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40"
                onClick={() => {
                  // This would trigger task creation with the specific status
                  console.log(`Add task to ${column.id}`)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
