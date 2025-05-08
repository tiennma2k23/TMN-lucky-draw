import { Prisma } from '@prisma/client'

export type ParticipantWhereInput = Prisma.ParticipantWhereInput

export type WinnerWhereInput = Prisma.WinnerWhereInput

export type ParticipantInclude = Prisma.ParticipantInclude

export type Participant = {
  id: string
  code: string
  name: string
  phone: string
  roundId: string
  round: DrawRound
  winners: Winner[]
  createdAt: Date
  updatedAt: Date
}

export type DrawRound = {
  id: string
  name: string
  description: string | null
  date: Date
  isActive: boolean
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
  participants: Participant[]
  prizes: RoundPrize[]
  winners: Winner[]
}

export type Prize = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  quantity: number
  createdAt: Date
  updatedAt: Date
  rounds: RoundPrize[]
  winners: Winner[]
}

export type Winner = {
  id: string
  roundId: string
  round: DrawRound
  prizeId: string
  prize: Prize
  participantId: string
  participant: Participant
  drawnAt: Date
}

export type Settings = {
  id: string
  currentRoundId: string | null
  backgroundImage: string | null
  createdAt: Date
  updatedAt: Date
}

export type RoundPrize = {
  id: string
  roundId: string
  prizeId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
  prize: Prize
  round: DrawRound
}

export type RoundStatistics = {
  totalPrizes: number
  remainingPrizes: {
    total: number
    byPrize: {
      prizeId: string
      prizeName: string
      total: number
      remaining: number
    }[]
  }
  drawnPrizes: DrawnPrize[]
}

export type DrawnPrize = {
  prizeId: string
  prizeName: string
  winners: {
    id: string
    code: string
    name: string
    phone: string
    drawnAt: Date
    prizeImageUrl?: string | null
  }[]
} 