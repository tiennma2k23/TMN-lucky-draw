"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { getParticipants, getDrawRounds } from "@/lib/actions"
import type { Participant, DrawRound } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [rounds, setRounds] = useState<DrawRound[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState<string>("")

  useEffect(() => {
    // Load available rounds
    const loadRounds = async () => {
      const rounds = await getDrawRounds()
      setRounds(rounds)
      if (rounds.length > 0) {
        setSelectedRoundId(rounds[0].id)
      }
    }
    loadRounds()
  }, [])

  const loadParticipants = async () => {
    try {
      setIsLoading(true)
      const response = await getParticipants(page, selectedRoundId)
      setParticipants(response.data)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error("Error loading participants:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedRoundId) {
      loadParticipants()
    }
  }, [page, selectedRoundId])

  const handleExportParticipants = async () => {
    try {
      const response = await fetch('/api/participants/export')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'participants_export.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting participants:", error)
      alert("Failed to export participants. Please try again.")
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Select Round</h3>
              <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select a round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={handleExportParticipants}>
              <Download className="mr-2 h-4 w-4" />
              Export All Participants
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Participant List</h3>
          <Button variant="outline" onClick={() => loadParticipants()}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-rose-600"></div>
          </div>
        ) : participants.length === 0 ? (
          <p className="text-center text-muted-foreground">No participants found.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prize Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Round</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">{participant.code}</TableCell>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>{participant.phone}</TableCell>
                    <TableCell>{participant.round?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
