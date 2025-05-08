"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { getWinners, exportWinners, getDrawRounds, getPrizes } from "@/lib/actions"
import { maskPhoneNumber } from "@/lib/utils"
import type { Winner, DrawRound, Prize } from "@/lib/types"

export default function WinnerManagement() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [rounds, setRounds] = useState<DrawRound[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRound, setSelectedRound] = useState<string>("all")
  const [selectedPrize, setSelectedPrize] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadWinners()
  }, [page, selectedRound, selectedPrize])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [roundsData, prizesData] = await Promise.all([getDrawRounds(), getPrizes()])
      setRounds(roundsData)
      setPrizes(prizesData)
      await loadWinners()
    } catch (error) {
      console.error("Error loading data:", error)
      setIsLoading(false)
    }
  }

  const loadWinners = async () => {
    try {
      setIsLoading(true)
      const response = await getWinners(page, selectedRound, selectedPrize)
      setWinners(response.data)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error("Error loading winners:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const { data, filename } = await exportWinners(selectedRound, selectedPrize)
      
      // Convert base64 to blob
      const byteCharacters = atob(data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting winners:", error)
      alert("Failed to export winners. Please try again.")
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const getRoundName = (roundId: string) => {
    const round = rounds.find((r) => r.id === roundId)
    return round ? round.name : "Unknown Round"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Round:</span>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Rounds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rounds</SelectItem>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span>Prize:</span>
            <Select value={selectedPrize} onValueChange={setSelectedPrize}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Prizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prizes</SelectItem>
                {prizes.map((prize) => (
                  <SelectItem key={prize.id} value={prize.id}>
                    {prize.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        </div>
      ) : winners.length === 0 ? (
        <p className="text-center text-muted-foreground">No winners yet.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead>Prize Code</TableHead>
                <TableHead>Winner Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Draw Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.map((winner) => (
                <TableRow key={winner.id}>
                  <TableCell>{getRoundName(winner.roundId)}</TableCell>
                  <TableCell>{winner.prize.name}</TableCell>
                  <TableCell className="font-medium">{winner.participant.code}</TableCell>
                  <TableCell>{winner.participant.name}</TableCell>
                  <TableCell>{maskPhoneNumber(winner.participant.phone)}</TableCell>
                  <TableCell>{new Date(winner.drawnAt).toLocaleString()}</TableCell>
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
  )
}
