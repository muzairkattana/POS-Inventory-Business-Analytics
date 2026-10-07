"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Plus, Trash2, GripVertical } from "lucide-react"

export interface TableColumn {
  id: string
  name: string
  key: string
  type: "text" | "number" | "percentage"
  width: string
  required: boolean
  visible: boolean
}

interface TableColumnManagerProps {
  columns: TableColumn[]
  onColumnsChange: (columns: TableColumn[]) => void
}

export default function TableColumnManager({ columns, onColumnsChange }: TableColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingColumns, setEditingColumns] = useState<TableColumn[]>(columns)

  const addColumn = () => {
    const newColumn: TableColumn = {
      id: Date.now().toString(),
      name: "New Column",
      key: `custom_${Date.now()}`,
      type: "text",
      width: "120px",
      required: false,
      visible: true,
    }
    setEditingColumns([...editingColumns, newColumn])
  }

  const removeColumn = (id: string) => {
    setEditingColumns(editingColumns.filter((col) => col.id !== id && !col.required))
  }

  const updateColumn = (id: string, field: keyof TableColumn, value: any) => {
    setEditingColumns(editingColumns.map((col) => (col.id === id ? { ...col, [field]: value } : col)))
  }

  const saveChanges = () => {
    onColumnsChange(editingColumns)
    setIsOpen(false)
  }

  const resetColumns = () => {
    setEditingColumns(columns)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
          <Settings className="w-4 h-4" />
          Manage Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Table Columns</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Customize your invoice table columns</p>
            <Button onClick={addColumn} size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Column
            </Button>
          </div>

          <div className="space-y-3">
            {editingColumns.map((column, index) => (
              <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                <GripVertical className="w-4 h-4 text-gray-400" />

                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Column Name</label>
                    <Input
                      value={column.name}
                      onChange={(e) => updateColumn(column.id, "name", e.target.value)}
                      className="text-sm h-8"
                      disabled={column.required}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Type</label>
                    <select
                      value={column.type}
                      onChange={(e) => updateColumn(column.id, "type", e.target.value)}
                      className="w-full text-sm h-8 border border-gray-300 rounded-md px-2"
                      disabled={column.required}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Width</label>
                    <Input
                      value={column.width}
                      onChange={(e) => updateColumn(column.id, "width", e.target.value)}
                      className="text-sm h-8"
                      placeholder="120px"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={(e) => updateColumn(column.id, "visible", e.target.checked)}
                        className="rounded"
                      />
                      Visible
                    </label>
                  </div>
                </div>

                {!column.required && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColumn(column.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={resetColumns}>
              Reset
            </Button>
            <Button onClick={saveChanges}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
