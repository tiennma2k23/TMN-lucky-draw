"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateBackgroundImage } from "@/lib/actions"
import { ImageIcon, Upload, X } from "lucide-react"
import Image from "next/image"

export default function BackgroundSettings() {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    // Kiểm tra định dạng file
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    setError(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!previewUrl) return

    try {
      setIsUploading(true)
      setError(null)

      const formData = new FormData(e.currentTarget)
      const result = await updateBackgroundImage(formData)

      if (result.success) {
        // Refresh page to show new background
        window.location.reload()
      }
    } catch (error: any) {
      setError(error.message || "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Background Image Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            {previewUrl ? (
              <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null)
                    // Reset the file input
                    const fileInput = document.getElementById("background-upload") as HTMLInputElement
                    if (fileInput) fileInput.value = ""
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-lg border bg-gray-50">
                <ImageIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}

            <div className="flex w-full items-center gap-2">
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="background-upload"
              />
              <label
                htmlFor="background-upload"
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                Choose Image
              </label>
              <Button
                type="submit"
                disabled={!previewUrl || isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, GIF. Max size: 5MB
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 