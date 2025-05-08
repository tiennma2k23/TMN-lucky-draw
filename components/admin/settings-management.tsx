"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { getSettings, updateSettings, updateBackgroundImage } from "@/lib/actions"
import Image from "next/image"

export default function SettingsManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null)
  const [backgroundPreview, setBackgroundPreview] = useState<string>("/images/default-background.jpg")
  const [codeLength, setCodeLength] = useState(8)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const settings = await getSettings()
      setCodeLength(settings.codeLength || 8)
      setBackgroundPreview(settings.backgroundImage || "/images/default-background.jpg")
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setBackgroundImage(file)
      // Preview ngay khi chọn file
      const previewUrl = URL.createObjectURL(file)
      setBackgroundPreview(previewUrl)
      // Clean up preview URL khi unmount
      return () => URL.revokeObjectURL(previewUrl)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)
      // Nếu có file background mới, upload trước
      if (backgroundImage) {
        const formData = new FormData();
        formData.append("image", backgroundImage);
        await updateBackgroundImage(formData)
      }
      // Lưu các setting khác
      await updateSettings({
        codeLength,
        backgroundImage: null, // Không truyền file ảnh nữa
      })
      await loadSettings()
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSaving(false)
      setBackgroundImage(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 text-lg font-medium">Background Image</h3>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border">
              <Image
                src={backgroundPreview || "/images/default-background.jpg"}
                alt="Background Preview"
                width={600}
                height={300}
                className="h-[200px] w-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-upload">Upload New Background</Label>
              <Input id="background-upload" type="file" accept="image/*" onChange={handleBackgroundChange} />
              <p className="text-xs text-muted-foreground">Recommended size: 1920x1080px. Max file size: 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 text-lg font-medium">Prize Code Settings</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code-length">Prize Code Length</Label>
              <Input
                id="code-length"
                type="number"
                min={6}
                max={10}
                value={codeLength}
                onChange={(e) => setCodeLength(Number.parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">Set the number of characters for prize codes (6-10)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
        {isSaving ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </div>
  )
}
