"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  X, Save, Trash2, Plus, CheckCircle2, Circle, 
  Clock, Tag, AlertCircle, Edit2, Pin, ListTodo, 
  StickyNote as StickyNoteIcon, ChevronDown, ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  completedAt?: Date
}

interface InvoiceNote {
  id: string
  content: string
  todos: TodoItem[]
  tags: string[]
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

interface InvoiceNotesModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId: string
  invoiceNumber: string
}

export default function InvoiceNotesModal({ 
  isOpen, 
  onClose, 
  invoiceId, 
  invoiceNumber 
}: InvoiceNotesModalProps) {
  const [note, setNote] = useState("")
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodoText, setNewTodoText] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isPinned, setIsPinned] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("notes")
  const [showCompleted, setShowCompleted] = useState(true)

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadNote()
    }
  }, [isOpen, invoiceId])

  const loadNote = () => {
    try {
      const notesData = localStorage.getItem("invoice-notes")
      if (notesData) {
        const notes: Record<string, InvoiceNote> = JSON.parse(notesData)
        if (notes[invoiceId]) {
          const existingNote = notes[invoiceId]
          setNote(existingNote.content)
          setTodos(existingNote.todos || [])
          setTags(existingNote.tags || [])
          setIsPinned(existingNote.isPinned || false)
        } else {
          resetForm()
        }
      } else {
        resetForm()
      }
      setHasChanges(false)
    } catch (error) {
      console.error("Failed to load note:", error)
      resetForm()
    }
  }

  const resetForm = () => {
    setNote("")
    setTodos([])
    setTags([])
    setIsPinned(false)
    setNewTodoText("")
    setNewTag("")
  }

  const saveNote = () => {
    try {
      setIsSaving(true)
      const notesData = localStorage.getItem("invoice-notes")
      const notes: Record<string, InvoiceNote> = notesData ? JSON.parse(notesData) : {}
      
      const now = new Date()
      const existingNote = notes[invoiceId]
      
      notes[invoiceId] = {
        id: existingNote?.id || `note-${Date.now()}`,
        content: note.trim(),
        todos: todos,
        tags: tags,
        isPinned: isPinned,
        createdAt: existingNote?.createdAt || now,
        updatedAt: now
      }
      
      localStorage.setItem("invoice-notes", JSON.stringify(notes))
      setHasChanges(false)
      
      setTimeout(() => {
        setIsSaving(false)
      }, 500)
    } catch (error) {
      console.error("Failed to save note:", error)
      alert("Failed to save note. Please try again.")
      setIsSaving(false)
    }
  }

  const deleteNote = () => {
    if (confirm("Are you sure you want to delete all notes and todos? This action cannot be undone.")) {
      try {
        const notesData = localStorage.getItem("invoice-notes")
        if (notesData) {
          const notes: Record<string, InvoiceNote> = JSON.parse(notesData)
          delete notes[invoiceId]
          localStorage.setItem("invoice-notes", JSON.stringify(notes))
        }
        resetForm()
        setHasChanges(false)
      } catch (error) {
        console.error("Failed to delete note:", error)
        alert("Failed to delete note. Please try again.")
      }
    }
  }

  // Todo functions
  const addTodo = () => {
    if (!newTodoText.trim()) return
    
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
      priority: 'medium',
      createdAt: new Date()
    }
    
    setTodos([...todos, newTodo])
    setNewTodoText("")
    setHasChanges(true)
  }

  const toggleTodo = (todoId: string) => {
    setTodos(todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, completed: !todo.completed, completedAt: !todo.completed ? new Date() : undefined }
        : todo
    ))
    setHasChanges(true)
  }

  const updateTodoPriority = (todoId: string, priority: 'low' | 'medium' | 'high') => {
    setTodos(todos.map(todo => 
      todo.id === todoId ? { ...todo, priority } : todo
    ))
    setHasChanges(true)
  }

  const deleteTodo = (todoId: string) => {
    setTodos(todos.filter(todo => todo.id !== todoId))
    setHasChanges(true)
  }

  // Tag functions
  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return
    setTags([...tags, newTag.trim()])
    setNewTag("")
    setHasChanges(true)
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
    setHasChanges(true)
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Do you want to close without saving?")) {
        resetForm()
        setHasChanges(false)
        onClose()
      }
    } else {
      onClose()
    }
  }

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const activeTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)
  const progressPercent = todos.length > 0 ? (completedTodos.length / todos.length) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className={cn(
        "bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4",
        "animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="bg-white p-2.5 rounded-xl shadow-sm">
              <StickyNoteIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 truncate">Notes & Todos</h2>
                {isPinned && <Pin className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-sm text-gray-600 truncate">{invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                "rounded-lg",
                isPinned ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"
              )}
              title={isPinned ? "Unpin" : "Pin"}
            >
              <Pin className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger 
                value="notes" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg border-b-2 border-transparent"
              >
                <StickyNoteIcon className="w-4 h-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="todos" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-t-lg border-b-2 border-transparent"
              >
                <ListTodo className="w-4 h-4 mr-2" />
                Todos ({activeTodos.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            <TabsContent value="notes" className="mt-0 space-y-4">
              {/* Tags Section */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 bg-white border-gray-300"
                  />
                  <Button 
                    onClick={addTag} 
                    size="sm"
                    variant="outline"
                    className="border-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Notes
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder="Write your notes here... (e.g., payment method, special instructions, follow-up reminders)"
                  className="min-h-[250px] resize-none bg-white border-gray-300"
                />
                <p className="text-xs text-gray-500 flex items-center justify-between">
                  <span>{note.length} characters</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Auto-saved to localStorage
                  </span>
                </p>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong className="font-semibold">💡 Tip:</strong> Notes are private and stored locally. Use tags to categorize and todos to track action items.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="todos" className="mt-0 space-y-4">
              {/* Add Todo */}
              <div className="flex gap-2">
                <Input
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a new todo..."
                  className="flex-1 bg-white border-gray-300"
                />
                <Button 
                  onClick={addTodo}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Progress Bar */}
              {todos.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">
                      {completedTodos.length} of {todos.length} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Active Todos */}
              {activeTodos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Active ({activeTodos.length})
                  </h3>
                  {activeTodos.map(todo => (
                    <div 
                      key={todo.id} 
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{todo.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <select
                              value={todo.priority}
                              onChange={(e) => updateTodoPriority(todo.id, e.target.value as any)}
                              className={cn(
                                "text-xs px-2 py-1 rounded border font-medium",
                                getPriorityColor(todo.priority)
                              )}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <span className="text-xs text-gray-500">
                              {new Date(todo.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTodo(todo.id)}
                          className="text-gray-400 hover:text-red-600 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Todos */}
              {completedTodos.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2 hover:text-gray-900"
                  >
                    {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Completed ({completedTodos.length})
                  </button>
                  {showCompleted && completedTodos.map(todo => (
                    <div 
                      key={todo.id} 
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="mt-0.5 text-green-600"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 line-through">{todo.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Completed {todo.completedAt ? new Date(todo.completedAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTodo(todo.id)}
                          className="text-gray-400 hover:text-red-600 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {todos.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No todos yet. Add one above to get started!</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                • Unsaved changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(note.trim() || todos.length > 0) && (
              <Button
                variant="outline"
                onClick={deleteNote}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={saveNote}
              disabled={!hasChanges || isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
