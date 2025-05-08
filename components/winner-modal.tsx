"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { maskPhoneNumber } from "@/lib/utils"
import { X } from "lucide-react"

interface WinnerModalProps {
  winner: {
    code: string
    name: string
    phone: string
    prizeImageUrl: string
  }
  prize: {
    name: string
  }
  onClose: () => void
}

export default function WinnerModal({ winner, prize, onClose }: WinnerModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-blue-600">
            Chúc mừng người trúng giải!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 p-4">
          <div className="relative h-48 w-48 overflow-hidden rounded-lg">
            <Image
              src={winner.prizeImageUrl}
              alt={prize.name}
              fill
              className="object-contain"
            />
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-blue-800">{prize.name}</h3>
            <p className="mt-2 text-lg">
              <span className="font-semibold">Mã dự thưởng:</span> {winner.code}
            </p>
            <p className="mt-1 text-lg">
              <span className="font-semibold">Tên người trúng:</span> {winner.name}
            </p>
            <p className="mt-1 text-lg">
              <span className="font-semibold">Số điện thoại:</span> {maskPhoneNumber(winner.phone)}
            </p>
          </div>

          <Button onClick={onClose} className="mt-4">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
