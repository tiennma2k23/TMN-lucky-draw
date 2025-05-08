"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getPrizes, getDrawRounds, getDrawRound, getSettings, getRoundStatistics, performDraw, getBackgroundImage, checkAvailableParticipants } from "@/lib/actions"
import type { Prize, DrawRound, RoundStatistics } from "@/lib/types"
import DrawWheel from "@/components/draw-wheel"
import WinnerModal from "@/components/winner-modal"
import { ImageIcon, Calendar, Home } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import DrawResults from "@/components/draw-results"
import Link from "next/link"

export default function DrawPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [rounds, setRounds] = useState<DrawRound[]>([])
  const [currentRound, setCurrentRound] = useState<DrawRound | null>(null)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [winner, setWinner] = useState<any>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [statistics, setStatistics] = useState<RoundStatistics | null>(null)
  const [backgroundImage, setBackgroundImage] = useState("/images/default-background.jpg")
  const [winnerCode, setWinnerCode] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [prizesData, roundsData, settings, bgImage] = await Promise.all([
          getPrizes(),
          getDrawRounds(),
          getSettings(),
          getBackgroundImage()
        ])

        setPrizes(prizesData)
        setRounds(roundsData)
        setBackgroundImage(bgImage)

        // Set current round based on settings or active status
        let currentRoundData = null
        if (settings.currentRoundId) {
          const round = await getDrawRound(settings.currentRoundId)
          if (round) {
            currentRoundData = round
            setCurrentRound(round)
          } else {
            // Fallback to first active round
            const activeRound = roundsData.find((r) => r.isActive)
            if (activeRound) {
              currentRoundData = activeRound
              setCurrentRound(activeRound)
            } else if (roundsData.length > 0) {
              // Fallback to first round
              currentRoundData = roundsData[0]
              setCurrentRound(roundsData[0])
            }
          }
        } else {
          // Fallback to first active round
          const activeRound = roundsData.find((r) => r.isActive)
          if (activeRound) {
            currentRoundData = activeRound
            setCurrentRound(activeRound)
          } else if (roundsData.length > 0) {
            // Fallback to first round
            currentRoundData = roundsData[0]
            setCurrentRound(roundsData[0])
          }
        }

        // Load statistics for the current round
        if (currentRoundData) {
          const roundStats = await getRoundStatistics(currentRoundData.id)
          setStatistics(roundStats)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Update statistics when round changes or after a draw
  useEffect(() => {
    const updateStatistics = async () => {
      if (!currentRound) return

      try {
        const roundStats = await getRoundStatistics(currentRound.id)
        setStatistics(roundStats)
      } catch (error) {
        console.error("Failed to load statistics:", error)
      }
    }

    updateStatistics()
  }, [currentRound, refreshTrigger])

  const handleSelectPrize = (prize: Prize) => {
    setSelectedPrize(prize)
  }

  const handleSelectRound = async (roundId: string) => {
    try {
      const round = await getDrawRound(roundId)
      if (round) {
        setCurrentRound(round)
        setSelectedPrize(null)

        // Update statistics for the new round
        const roundStats = await getRoundStatistics(roundId)
        setStatistics(roundStats)
      }
    } catch (error) {
      console.error("Error selecting round:", error)
    }
  }

  const handleStartDraw = async () => {
    if (!currentRound || !selectedPrize) return

    try {
      // Kiểm tra số lượng giải thưởng còn lại trước khi quay
      const roundStats = await getRoundStatistics(currentRound.id)
      const prizeStats = roundStats.remainingPrizes.byPrize.find(p => p.prizeId === selectedPrize.id)
      
      if (!prizeStats || prizeStats.remaining <= 0) {
        alert("Đã hết giải thưởng này trong lần quay này")
        return
      }

      // Kiểm tra số người tham gia còn lại
      const { canDraw, message } = await checkAvailableParticipants(currentRound.id)
      if (!canDraw) {
        alert(message)
        return
      }

      setIsDrawing(true)
      setWinnerCode(null)

      // Thêm delay 5 giây trước khi hiển thị kết quả
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const { winner, statistics, winnerCode } = await performDraw(currentRound.id, selectedPrize.id)
      
      // Đảm bảo mã dự thưởng hiển thị trong quá trình quay khớp với kết quả
      setWinner({
        code: winner.participant.code,
        name: winner.participant.name,
        phone: winner.participant.phone,
        prizeImageUrl: winner.prize.imageUrl,
      })
      setWinnerCode(winnerCode)
      setShowWinnerModal(true)
      
      // Trigger refresh of results
      setRefreshTrigger((prev) => prev + 1)

      // Update statistics with the new data
      setStatistics(statistics)
    } catch (error: any) {
      console.error("Error during draw:", error)
      alert(error.message || "Có lỗi xảy ra khi quay số. Vui lòng thử lại.")
    } finally {
      setIsDrawing(false)
    }
  }

  const handleCloseWinnerModal = () => {
    setShowWinnerModal(false)
    setWinner(null)
    setSelectedPrize(null)
    setWinnerCode(null)
  }

  // Get available prizes for the current round with remaining quantities
  const getAvailablePrizes = () => {
    if (!currentRound || !statistics) return []

    return currentRound.prizes
      .map((roundPrize) => {
        const prize = prizes.find((p) => p.id === roundPrize.prizeId)
        if (!prize) return null

        // Find remaining quantity from statistics
        const prizeStats = statistics.remainingPrizes.byPrize.find((p) => p.prizeId === roundPrize.prizeId)

        const remaining = prizeStats ? prizeStats.remaining : roundPrize.quantity

        return {
          ...prize,
          quantity: roundPrize.quantity,
          remaining: remaining,
        }
      })
      .filter(Boolean)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundImage} 
          alt="Background" 
          fill 
          className="object-cover" 
          priority 
          quality={100}
        />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center p-8">
        <div className="mb-4 flex w-full max-w-4xl items-center justify-between">
          <h1 className="text-4xl font-bold text-blue-800">Doraemon Lucky Draw</h1>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 bg-white/80 hover:bg-white">
              <Home className="h-4 w-4" />
              Back Home
            </Button>
          </Link>
        </div>

        {/* Round selection */}
        <div className="mb-6 w-full max-w-4xl">
          <Tabs defaultValue={currentRound?.id || "1"} onValueChange={handleSelectRound}>
            <TabsList className="grid w-full grid-cols-5">
              {rounds.map((round) => (
                <TabsTrigger key={round.id} value={round.id} disabled={round.isCompleted}>
                  {round.name}
                  {round.isActive && <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4 rounded-lg bg-white/80 p-4 text-center">
              <h2 className="text-xl font-bold text-blue-800">
                {currentRound?.name}: {currentRound?.description}
              </h2>
              {currentRound?.date && (
                <p className="mt-1 flex items-center justify-center text-sm text-gray-600">
                  <Calendar className="mr-1 h-4 w-4" />
                  {new Date(currentRound.date).toLocaleDateString()}
                </p>
              )}
            </div>
          </Tabs>
        </div>

        {/* Prize selection */}
        <div className="mb-8 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {getAvailablePrizes().map((prize: any) => (
            <Card
              key={prize.id}
              className={`cursor-pointer transition-all ${
                selectedPrize?.id === prize.id ? "border-4 border-blue-500" : "hover:border-blue-300"
              }`}
              onClick={() => handleSelectPrize(prize)}
            >
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
                  <h3 className="text-lg font-bold">{prize.name}</h3>
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className="mb-1">
                      Còn lại: {prize.remaining}
                    </Badge>
                    <Badge variant="secondary">Tổng: {prize.quantity}</Badge>
                  </div>
                </div>
                {prize.description && <p className="mt-1 text-sm text-muted-foreground">{prize.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Draw wheel */}
        <div className="mb-8 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex flex-col items-center justify-center">
              <DrawWheel 
                isActive={isDrawing} 
                selectedPrize={selectedPrize} 
                winnerCode={winnerCode || undefined}
              />

              <Button
                size="lg"
                className="mt-8 bg-blue-600 hover:bg-blue-700"
                disabled={!selectedPrize || isDrawing || !currentRound?.isActive}
                onClick={handleStartDraw}
              >
                {isDrawing ? "Đang quay..." : "Quay ngay"}
              </Button>

              {!currentRound?.isActive && (
                <p className="mt-2 text-sm text-red-500">
                  Lần quay này chưa được kích hoạt. Vui lòng kích hoạt trong trang quản trị.
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            {currentRound && <DrawResults roundId={currentRound.id} refreshTrigger={refreshTrigger} />}
          </div>
        </div>

        {showWinnerModal && winner && (
          <WinnerModal 
            winner={winner} 
            prize={selectedPrize!} 
            onClose={handleCloseWinnerModal} 
          />
        )}
      </div>
    </div>
  )
}
