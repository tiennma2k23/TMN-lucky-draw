"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Edit, Calendar, Check, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DrawRound, Prize } from "@/lib/types"
import {
  getDrawRounds,
  createDrawRound,
  updateDrawRound,
  deleteDrawRound,
  getPrizes,
  setActiveRound,
} from "@/lib/actions"
import { UploadParticipants } from '@/components/upload-participants'

export default function RoundManagement() {
  const [rounds, setRounds] = useState<DrawRound[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingRound, setEditingRound] = useState<DrawRound | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [selectedPrizes, setSelectedPrizes] = useState<{ prizeId: string; quantity: number }[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [roundsData, prizesData] = await Promise.all([getDrawRounds(), getPrizes()])
      setRounds(roundsData)
      setPrizes(prizesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddPrize = () => {
    if (prizes.length === 0) return

    // Add first prize by default if none selected
    const prizeToAdd = {
      prizeId: prizes[0].id,
      quantity: 1,
    }

    setSelectedPrizes([...selectedPrizes, prizeToAdd])
  }

  const handleRemovePrize = (index: number) => {
    const newPrizes = [...selectedPrizes]
    newPrizes.splice(index, 1)
    setSelectedPrizes(newPrizes)
  }

  const handlePrizeChange = (index: number, field: "prizeId" | "quantity", value: string | number) => {
    const newPrizes = [...selectedPrizes]
    newPrizes[index] = {
      ...newPrizes[index],
      [field]: value,
    }
    setSelectedPrizes(newPrizes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedPrizes.length === 0) {
      alert("Please add at least one prize")
      return
    }

    try {
      if (editingRound) {
        await updateDrawRound(editingRound.id, {
          ...formData,
          date,
          prizes: selectedPrizes,
          isActive: editingRound.isActive,
          isCompleted: editingRound.isCompleted,
        })
      } else {
        await createDrawRound({
          ...formData,
          date,
          prizes: selectedPrizes,
        })
      }

      // Reset form and reload rounds
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error saving round:", error)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setEditingRound(null)
    setSelectedPrizes([])
    setDate(undefined)
  }

  const handleEdit = (round: DrawRound) => {
    setEditingRound(round)
    setFormData({
      name: round.name,
      description: round.description || "",
    })
    setDate(round.date)
    setSelectedPrizes(round.prizes)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this round?")) {
      try {
        await deleteDrawRound(id)
        await loadData()
      } catch (error) {
        console.error("Error deleting round:", error)
      }
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      await setActiveRound(id)
      await loadData()
    } catch (error) {
      console.error("Error setting active round:", error)
    }
  }

  const handleToggleCompleted = async (round: DrawRound) => {
    try {
      await updateDrawRound(round.id, {
        ...round,
        name: round.name,
        description: round.description,
        date: round.date,
        prizes: round.prizes,
        isCompleted: !round.isCompleted,
      })
      await loadData()
    } catch (error) {
      console.error("Error toggling completed status:", error)
    }
  }

  const getPrizeName = (prizeId: string) => {
    const prize = prizes.find((p) => p.id === prizeId)
    return prize ? prize.name : "Unknown Prize"
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
        <h3 className="text-lg font-medium">{editingRound ? "Edit Round" : "Add New Round"}</h3>

        <div className="space-y-2">
          <Label htmlFor="name">Round Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Lần 1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter round description"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Round Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Prizes</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddPrize}>
              Add Prize
            </Button>
          </div>

          {selectedPrizes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No prizes added yet. Click "Add Prize" to add prizes to this round.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedPrizes.map((prize, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select value={prize.prizeId} onValueChange={(value) => handlePrizeChange(index, "prizeId", value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select prize" />
                    </SelectTrigger>
                    <SelectContent>
                      {prizes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min="1"
                    value={prize.quantity}
                    onChange={(e) => handlePrizeChange(index, "quantity", Number.parseInt(e.target.value))}
                    className="w-20"
                  />

                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePrize(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {editingRound ? "Update Round" : "Add Round"}
          </Button>

          {editingRound && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
        {editingRound && (
          <div className="pt-4 border-t mt-4">
            <h4 className="font-medium mb-2">Upload danh sách người tham gia cho vòng này</h4>
            <UploadParticipants roundId={editingRound.id} onSuccess={loadData} />
          </div>
        )}
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Round List</h3>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          </div>
        ) : rounds.length === 0 ? (
          <p className="text-center text-muted-foreground">No rounds added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Prizes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rounds.map((round) => (
                <TableRow key={round.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{round.name}</div>
                      {round.description && <div className="text-sm text-muted-foreground">{round.description}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{round.date ? format(new Date(round.date), "PPP") : "Not set"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {round.prizes.map((prize, index) => (
                        <Badge key={index} variant="outline">
                          {getPrizeName(prize.prizeId)} x{prize.quantity}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {round.isActive && <Badge className="bg-green-500">Active</Badge>}
                      {round.isCompleted && <Badge className="bg-gray-500">Completed</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(round)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(round.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetActive(round.id)}
                        disabled={round.isActive || round.isCompleted}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleCompleted(round)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
