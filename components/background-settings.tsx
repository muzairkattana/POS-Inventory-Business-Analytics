"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Image,
  Upload,
  Palette,
  RotateCcw,
  Check,
  X,
  Trash2,
  Download,
} from "lucide-react"

interface BackgroundSettings {
  type: 'none' | 'gradient' | 'image'
  value: string
  opacity: number
}

interface BackgroundSettingsProps {
  isOpen: boolean
  onClose: () => void
  currentSettings: BackgroundSettings
  onSettingsChange: (settings: BackgroundSettings) => void
}

const predefinedGradients = [
  { name: "Ocean Breeze", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Forest", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Lavender", value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
  { name: "Midnight", value: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)" },
  { name: "Aurora", value: "linear-gradient(135deg, #667db6 0%, #0082c8 25%, #0082c8 75%, #667db6 100%)" },
]

const predefinedImages = [
  { name: "Minimal Workspace", url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1920&q=80" },
  { name: "Clean Desk", url: "https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=1920&q=80" },
  { name: "Nature View", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80" },
  { name: "Mountain Range", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80" },
  { name: "Abstract Shapes", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80" },
]

export default function BackgroundSettings({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
}: BackgroundSettingsProps) {
  const [tempSettings, setTempSettings] = useState<BackgroundSettings>(currentSettings)
  const [customImageUrl, setCustomImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    onSettingsChange(tempSettings)
    onClose()
  }

  const handleReset = () => {
    const resetSettings = { type: 'none' as const, value: '', opacity: 0.1 }
    setTempSettings(resetSettings)
    onSettingsChange(resetSettings)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setTempSettings({
          ...tempSettings,
          type: 'image',
          value: result,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCustomImageUrl = () => {
    if (customImageUrl.trim()) {
      setTempSettings({
        ...tempSettings,
        type: 'image',
        value: customImageUrl.trim(),
      })
      setCustomImageUrl('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Background Settings
          </DialogTitle>
          <DialogDescription>
            Customize your Todo Manager background with gradients or images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Background Type Selection */}
          <div className="space-y-2">
            <Label>Background Type</Label>
            <Select
              value={tempSettings.type}
              onValueChange={(value) => setTempSettings({ ...tempSettings, type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-2">
            <Label>Background Opacity: {Math.round(tempSettings.opacity * 100)}%</Label>
            <Slider
              value={[tempSettings.opacity]}
              onValueChange={(value) => setTempSettings({ ...tempSettings, opacity: value[0] })}
              max={1}
              min={0.05}
              step={0.05}
              className="w-full"
            />
          </div>

          {/* Gradient Options */}
          {tempSettings.type === 'gradient' && (
            <div className="space-y-4">
              <Label>Choose a Gradient</Label>
              <div className="grid grid-cols-2 gap-3">
                {predefinedGradients.map((gradient) => (
                  <button
                    key={gradient.name}
                    onClick={() => setTempSettings({ ...tempSettings, value: gradient.value })}
                    className="relative h-16 rounded-lg border-2 border-transparent hover:border-primary transition-colors overflow-hidden"
                    style={{ background: gradient.value }}
                  >
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{gradient.name}</span>
                    </div>
                    {tempSettings.value === gradient.value && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Gradient Input */}
              <div className="space-y-2">
                <Label>Custom CSS Gradient</Label>
                <Input
                  placeholder="linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)"
                  value={tempSettings.value}
                  onChange={(e) => setTempSettings({ ...tempSettings, value: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Image Options */}
          {tempSettings.type === 'image' && (
            <div className="space-y-4">
              {/* Predefined Images */}
              <div className="space-y-2">
                <Label>Choose a Background Image</Label>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedImages.map((image) => (
                    <button
                      key={image.name}
                      onClick={() => setTempSettings({ ...tempSettings, value: image.url })}
                      className="relative h-20 rounded-lg border-2 border-transparent hover:border-primary transition-colors overflow-hidden bg-cover bg-center"
                      style={{ backgroundImage: `url(${image.url})` }}
                    >
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{image.name}</span>
                      </div>
                      {tempSettings.value === image.url && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-2">
                <Label>Custom Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                  />
                  <Button onClick={handleCustomImageUrl} size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload from Computer
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Current Image Preview */}
              {tempSettings.value && (
                <div className="space-y-2">
                  <Label>Current Background</Label>
                  <div
                    className="h-24 rounded-lg border bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${tempSettings.value})`,
                      opacity: tempSettings.opacity 
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 relative overflow-hidden"
              style={{
                background: tempSettings.type === 'gradient' ? tempSettings.value : 
                           tempSettings.type === 'image' ? `url(${tempSettings.value})` : 'transparent',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: tempSettings.opacity,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/90 px-4 py-2 rounded-lg text-sm font-medium">
                  Todo Manager Preview
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
