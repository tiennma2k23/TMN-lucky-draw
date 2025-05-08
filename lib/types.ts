export interface Prize {
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

export interface DrawRound {
  id: string
  name: string
  description: string | null
  date: Date
  isActive: boolean
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
  prizes: RoundPrize[]
  winners: Winner[]
}

export interface RoundPrize {
  id: string
  roundId: string
  prizeId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
  round: DrawRound
  prize: Prize
}

export interface Participant {
  id: string
  code: string
  name: string
  phone: string
  roundId: string
  round: DrawRound
  createdAt: Date
  updatedAt: Date
  winners: Winner[]
}

export interface Winner {
  id: string
  roundId: string
  prizeId: string
  participantId: string
  drawnAt: Date
  round: DrawRound
  prize: Prize
  participant: Participant
}

// Add a new interface for tracking drawn prizes
export interface DrawnPrize {
  prizeId: string
  prizeName: string
  winners: {
    id: string
    code: string
    name: string
    phone: string
    drawnAt: Date
    prizeImageUrl: string | null
  }[]
}

// Add a new interface for round statistics
export interface RoundStatistics {
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

export interface Settings {
  id: string
  currentRoundId: string | null
  backgroundImage: string | null
  createdAt: Date
  updatedAt: Date
}
