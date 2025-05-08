"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit, ImageIcon, Upload, X } from "lucide-react"
import type { Prize } from "@/lib/types"
import { getPrizes, createPrize, updatePrize, deletePrize, createDefaultPrizes } from "@/lib/actions"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

// Mock winners data (replace with actual data fetching)
const mockWinners = [
  { prizeId: "1", userId: "user1" },
  { prizeId: "2", userId: "user2" },
  { prizeId: "1", userId: "user3" },
  { prizeId: "3", userId: "user4" },
  { prizeId: "1", userId: "user5" },
]

export default function PrizeManagement() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [prizeImage, setPrizeImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    loadPrizes()
  }, [])

  const loadPrizes = async () => {
    try {
      setIsLoading(true)
      const data = await getPrizes()
      setPrizes(data)
    } catch (error) {
      console.error("Failed to load prizes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      if (editingPrize) {
        formData.append("id", editingPrize.id)
        await updatePrize(formData)
      } else {
        await createPrize(formData)
      }

      // Refresh prize list
      const updatedPrizes = await getPrizes()
      setPrizes(updatedPrizes)
      setEditingPrize(null)
      setPreviewUrl(null)
      e.currentTarget.reset()
    } catch (error: any) {
      setError(error.message || "Failed to save prize")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize)
    setFormData({
      name: prize.name,
      description: prize.description || "",
    })
    setPreviewUrl(prize.imageUrl || null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prize?")) return

    try {
      await deletePrize(id)
      const updatedPrizes = await getPrizes()
      setPrizes(updatedPrizes)
    } catch (error: any) {
      setError(error.message || "Failed to delete prize")
    }
  }

  const handleCreateDefaultPrizes = async () => {
    try {
      setIsLoading(true)
      const result = await createDefaultPrizes()
      if (result.success) {
        await loadPrizes()
      } else {
        setError(result.error || "Failed to create default prizes")
      }
    } catch (error: any) {
      setError(error.message || "Failed to create default prizes")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prize Management</CardTitle>
          <Button 
            onClick={handleCreateDefaultPrizes}
            disabled={isLoading}
            variant="outline"
          >
            Create Default Prizes
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Prize Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter prize name (e.g., First Prize - 10,000,000đ)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter prize description (e.g., Cash prize of 10,000,000đ)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Prize Image</Label>
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
                    onClick={() => setPreviewUrl(null)}
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
                  id="prize-upload"
                />
                <label
                  htmlFor="prize-upload"
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  Choose Image
                </label>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            {editingPrize && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingPrize(null)
                  setPreviewUrl(null)
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : editingPrize ? "Update Prize" : "Add Prize"}
            </Button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold">Existing Prizes</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {prizes.map((prize) => {
              // Calculate how many of this prize have been drawn
              const drawnCount = mockWinners.filter((w) => w.prizeId === prize.id).length

              // Determine fixed quantity based on prize name
              let fixedQuantity = 1;
              if (prize.name.toLowerCase().includes("second")) {
                fixedQuantity = 2;
              } else if (prize.name.toLowerCase().includes("third")) {
                fixedQuantity = 3;
              } else if (prize.name.toLowerCase().includes("consolation")) {
                fixedQuantity = 10;
              }

              return (
                <Card key={prize.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
                      {prize.imageUrl ? (
                        <Image
                          src={prize.imageUrl}
                          alt={prize.name}
                          width={120}
                          height={120}
                          className="h-full max-h-[120px] w-auto object-contain"
                          unoptimized
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{prize.name}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prize)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(prize.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {prize.description && (
                      <p className="mt-1 text-sm text-gray-500">{prize.description}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
