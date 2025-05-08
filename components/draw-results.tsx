"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Trophy, ImageIcon } from "lucide-react"
import type { RoundStatistics, DrawnPrize } from "@/lib/types"
import { getRoundStatistics } from "@/lib/actions"
import { maskPhoneNumber } from "@/lib/utils"
import Image from "next/image"

interface DrawResultsProps {
  roundId: string
  refreshTrigger: number
}

export default function DrawResults({ roundId, refreshTrigger }: DrawResultsProps) {
  const [statistics, setStatistics] = useState<RoundStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!roundId) return

    const loadStatistics = async () => {
      try {
        setIsLoading(true)
        const data = await getRoundStatistics(roundId)
        setStatistics(data)
      } catch (error) {
        console.error("Failed to load statistics:", error)
        // Set default statistics to prevent errors
        setStatistics({
          totalPrizes: 0,
          remainingPrizes: {
            total: 0,
            byPrize: [],
          },
          drawnPrizes: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStatistics()
  }, [roundId, refreshTrigger])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Kết quả quay thưởng</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  if (!statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Kết quả quay thưởng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Không có dữ liệu</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center">Kết quả quay thưởng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <span className="font-medium">Tổng số giải:</span>
          <Badge variant="outline" className="text-base">
            {statistics.remainingPrizes.total} / {statistics.totalPrizes}
          </Badge>
        </div>

        {/* Hiển thị số lượng còn lại cho từng loại giải */}
        <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-3">
          <h3 className="font-medium">Giải còn lại:</h3>
          {statistics.remainingPrizes.byPrize.map((prize) => (
            <div key={prize.prizeId} className="flex items-center justify-between">
              <span className="text-sm">{prize.prizeName}:</span>
              <Badge variant="outline" className="text-xs">
                {prize.remaining} / {prize.total}
              </Badge>
            </div>
          ))}
        </div>

        {statistics.drawnPrizes.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">Chưa có người trúng giải</p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            {statistics.drawnPrizes.map((drawnPrize: DrawnPrize) => (
              <div key={drawnPrize.prizeId} className="mb-4">
                <div className="mb-2 flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  <h3 className="font-medium">{drawnPrize.prizeName}</h3>
                  <Badge className="ml-2">{drawnPrize.winners.length}</Badge>
                </div>

                <div className="space-y-2 pl-7">
                  {drawnPrize.winners.map((winner) => (
                    <div key={winner.id} className="rounded-md bg-gray-50 p-2 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-white">
                          {winner.prizeImageUrl ? (
                            <Image
                              src={winner.prizeImageUrl}
                              alt={drawnPrize.prizeName}
                              width={40}
                              height={40}
                              className="h-auto max-h-[40px] w-auto max-w-[40px] object-contain"
                              unoptimized
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{winner.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Mã số: {winner.code} | SĐT: {maskPhoneNumber(winner.phone)} |{" "}
                            {new Date(winner.drawnAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
