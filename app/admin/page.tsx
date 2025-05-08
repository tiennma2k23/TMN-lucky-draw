"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PrizeManagement from "@/components/admin/prize-management"
import ParticipantManagement from "@/components/admin/participant-management"
import SettingsManagement from "@/components/admin/settings-management"
import WinnerManagement from "@/components/admin/winner-management"
import RoundManagement from "@/components/admin/round-management"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import BackgroundSettings from "@/components/admin/background-settings"
import { UploadParticipants } from '@/components/upload-participants'
import { DrawRound, Participant, Prize, Winner } from "@prisma/client"
import { getRounds, setActiveRound, updateDrawRound, createDrawRound, deleteDrawRound } from "@/lib/actions"
import { toast } from "sonner"

type RoundWithDetails = DrawRound & {
  participants: Participant[]
  prizes: (RoundPrize & {
    prize: Prize
  })[]
  winners: (Winner & {
    participant: Participant
    prize: Prize
  })[]
}

export default function AdminPage() {
  const [rounds, setRounds] = useState<RoundWithDetails[]>([])
  const [selectedRound, setSelectedRound] = useState<RoundWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchRounds = async () => {
    try {
      const data = await getRounds()
      setRounds(data)
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải danh sách vòng quay')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRounds()
  }, [])

  const handleSetActiveRound = async (id: string) => {
    try {
      await setActiveRound(id)
      await fetchRounds()
      toast.success('Đã cập nhật vòng quay hoạt động')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật vòng quay')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý quay thưởng</h1>
        <Link href="/">
          <Button variant="outline">Quay lại trang chủ</Button>
        </Link>
      </div>
      <Tabs defaultValue="prize" className="w-full">
        <TabsList className="mb-4 w-full flex flex-wrap gap-2">
          <TabsTrigger value="prize">Giải thưởng</TabsTrigger>
          <TabsTrigger value="round">Vòng quay</TabsTrigger>
          <TabsTrigger value="participant">Người tham gia</TabsTrigger>
          <TabsTrigger value="winner">Người trúng thưởng</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>
        <TabsContent value="prize">
          <PrizeManagement />
        </TabsContent>
        <TabsContent value="round">
          <RoundManagement />
        </TabsContent>
        <TabsContent value="participant">
          <ParticipantManagement />
        </TabsContent>
        <TabsContent value="winner">
          <WinnerManagement />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsManagement />
          <div className="mt-8">
            <BackgroundSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
