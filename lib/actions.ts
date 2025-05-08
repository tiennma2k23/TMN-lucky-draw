"use server"

import { revalidatePath } from "next/cache"
import type {
  Prize,
  Participant,
  Winner,
  Settings,
  DrawRound,
  RoundPrize,
  RoundStatistics,
  DrawnPrize
} from "./types"
import { maskPhoneNumber } from "./utils"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { writeFile } from "fs/promises"
import { join } from "path"
import * as XLSX from "xlsx"
import fs from "fs/promises"

// Prize actions
export async function getPrizes(): Promise<Prize[]> {
  const prizes = await prisma.prize.findMany({
    include: {
      rounds: {
        include: {
          round: true,
          prize: true
        }
      },
      winners: true
    }
  })
  return prizes as Prize[]
}

async function handleImageUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "images", "prizes")
    await fs.mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `prize-${timestamp}.${extension}`
    const path = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(path, buffer)

    // Return the relative path from public directory
    return `/images/prizes/${filename}`
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }
}

export async function createPrize(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const imageFile = formData.get("image") as File | null

    if (!name || !description) {
      throw new Error("Missing required fields")
    }

    const imageUrl = await handleImageUpload(imageFile)

    const prize = await prisma.prize.create({
      data: {
        name,
        description,
        imageUrl,
      },
      include: {
        rounds: {
          include: {
            round: true,
            prize: true
          }
        },
        winners: true
      }
    })

    revalidatePath("/admin")
    return { success: true, prize: prize as Prize }
  } catch (error) {
    console.error("Error creating prize:", error)
    return { success: false, error: "Failed to create prize" }
  }
}

export async function updatePrize(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const imageFile = formData.get("image") as File | null

    if (!id || !name || !description) {
      throw new Error("Missing required fields")
    }

    const oldPrize = await prisma.prize.findUnique({
      where: { id },
    })

    if (!oldPrize) {
      throw new Error("Prize not found")
    }

    let imageUrl = oldPrize.imageUrl

    // Only handle image upload if a new file is provided
    if (imageFile && imageFile.size > 0) {
      // Upload new image
      imageUrl = await handleImageUpload(imageFile)
    }

    const prize = await prisma.prize.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
      },
      include: {
        rounds: {
          include: {
            round: true,
            prize: true
          }
        },
        winners: true
      }
    })

    revalidatePath("/admin")
    return { success: true, prize: prize as Prize }
  } catch (error) {
    console.error("Error updating prize:", error)
    return { success: false, error: "Failed to update prize" }
  }
}

export async function deletePrize(id: string): Promise<void> {
  try {
    // First delete related records
    await prisma.winner.deleteMany({
      where: { prizeId: id }
    });
    
    await prisma.roundPrize.deleteMany({
      where: { prizeId: id }
    });

    // Then delete the prize
    await prisma.prize.delete({
      where: { id },
    })
    
    revalidatePath("/admin")
    revalidatePath("/draw")
  } catch (error) {
    console.error("Error deleting prize:", error)
    throw error
  }
}

// Draw Round actions
export async function getDrawRounds(): Promise<DrawRound[]> {
  const rounds = await prisma.drawRound.findMany({
    include: {
      prizes: {
        include: {
          prize: true,
          round: true
        },
      },
      winners: true
    },
  })
  return rounds as DrawRound[]
}

export async function getDrawRound(id: string): Promise<DrawRound | null> {
  const round = await prisma.drawRound.findUnique({
    where: { id },
    include: {
      prizes: {
        include: {
          prize: true,
          round: true
        },
      },
      winners: true
    },
  })
  return round as DrawRound | null
}

export async function createDrawRound(data: {
  name: string
  description?: string
  date?: Date
  prizes: RoundPrize[]
}): Promise<DrawRound> {
  const newRound = await prisma.drawRound.create({
    data: {
      name: data.name,
      description: data.description,
      date: data.date || new Date(),
      prizes: {
        create: data.prizes.map((prize) => ({
          prizeId: prize.prizeId,
          quantity: prize.quantity,
        })),
      },
    },
    include: {
      prizes: {
        include: {
          prize: true,
          round: true
        },
      },
      winners: true
    },
  })

  revalidatePath("/admin")
  revalidatePath("/draw")
  return newRound as DrawRound
}

export async function updateDrawRound(
  id: string,
  data: {
    name: string
    description?: string
    date?: Date
    prizes: RoundPrize[]
    isActive?: boolean
    isCompleted?: boolean
  },
): Promise<DrawRound> {
  // If setting this round as active, deactivate all other rounds
  if (data.isActive) {
    await prisma.drawRound.updateMany({
      where: { id: { not: id } },
      data: { isActive: false },
    })
  }

  // Delete existing prizes
  await prisma.roundPrize.deleteMany({
    where: { roundId: id },
  })

  const updatedRound = await prisma.drawRound.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      date: data.date || new Date(),
      isActive: data.isActive,
      isCompleted: data.isCompleted,
      prizes: {
        create: data.prizes.map((prize) => ({
          prizeId: prize.prizeId,
          quantity: prize.quantity,
        })),
      },
    },
    include: {
      prizes: {
        include: {
          prize: true,
          round: true
        },
      },
      winners: true
    },
  })

  revalidatePath("/admin")
  revalidatePath("/draw")
  return updatedRound as DrawRound
}

export async function deleteDrawRound(id: string): Promise<void> {
  // Xóa winner trước
  await prisma.winner.deleteMany({ where: { roundId: id } })
  // Xóa participant
  await prisma.participant.deleteMany({ where: { roundId: id } })
  // Xóa roundPrize
  await prisma.roundPrize.deleteMany({ where: { roundId: id } })
  // Cuối cùng xóa drawRound
  await prisma.drawRound.delete({ where: { id } })

  revalidatePath("/admin")
  revalidatePath("/draw")
}

export async function setActiveRound(id: string): Promise<void> {
  // Deactivate all rounds
  await prisma.drawRound.updateMany({
    data: { isActive: false },
  })

  // Activate the selected round
  await prisma.drawRound.update({
    where: { id },
    data: { isActive: true },
  })

  revalidatePath("/admin")
  revalidatePath("/draw")
}

// Participant actions
export async function getParticipants(page = 1, roundId?: string, pageSize = 10): Promise<{ data: Participant[]; totalPages: number }> {
  const where = roundId ? {
    roundId
  } : {}

  const [data, total] = await Promise.all([
    prisma.participant.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        winners: {
          include: {
            round: true,
            prize: true
          }
        },
        round: true
      }
    }),
    prisma.participant.count({ where }),
  ])

  return {
    data: data as unknown as Participant[],
    totalPages: Math.ceil(total / pageSize),
  }
}

// Winner actions
export async function getWinners(
  page = 1,
  roundId = "all",
  prizeId = "all",
  pageSize = 10,
): Promise<{ data: Winner[]; totalPages: number }> {
  const where = {
    ...(roundId !== "all" ? { roundId } : {}),
    ...(prizeId !== "all" ? { prizeId } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.winner.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        prize: true,
        participant: true,
        round: {
          include: {
            prizes: {
              include: {
                prize: true,
                round: true
              }
            },
            winners: true
          }
        }
      },
    }),
    prisma.winner.count({ where }),
  ])

  return {
    data: data as Winner[],
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function exportWinners(roundId: string = "all", prizeId: string = "all") {
  try {
    // Get winners with related data
    const winners = await prisma.winner.findMany({
      where: {
        ...(roundId !== "all" ? { roundId } : {}),
        ...(prizeId !== "all" ? { prizeId } : {}),
      },
      include: {
        round: true,
        prize: true,
        participant: true,
      },
      orderBy: {
        drawnAt: "desc",
      },
    })

    // Prepare data for Excel
    const data = winners.map((winner) => ({
      "Lần quay": winner.round.name,
      "Giải thưởng": winner.prize.name,
      "Mã số": winner.participant.code,
      "Tên người trúng": winner.participant.name,
      "Số điện thoại": winner.participant.phone,
      "Thời gian quay": new Date(winner.drawnAt).toLocaleString(),
    }))

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Winners")

    // Generate buffer and convert to base64
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    const base64 = Buffer.from(buffer).toString("base64")

    // Return the base64 string and filename
    return {
      data: base64,
      filename: `winners_${new Date().toISOString().split("T")[0]}.xlsx`,
    }
  } catch (error) {
    console.error("Error exporting winners:", error)
    throw new Error("Failed to export winners")
  }
}

// Settings actions
export async function getSettings(): Promise<Settings> {
  const settings = await prisma.settings.findFirst()
  return settings || {
    id: "1",
    currentRoundId: null,
    backgroundImage: "/images/default-background.jpg",
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export async function updateSettings(data: {
  codeLength: number
  backgroundImage: File | null
  currentRoundId?: string
}): Promise<Settings> {
  const settings = await prisma.settings.upsert({
    where: { id: "1" },
    create: {
      id: "1",
      currentRoundId: data.currentRoundId || null,
      backgroundImage: "/images/default-background.jpg",
    },
    update: {
      currentRoundId: data.currentRoundId || null,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/draw")

  return settings
}

// Draw actions
export async function getRoundStatistics(roundId: string): Promise<RoundStatistics> {
  const round = await prisma.drawRound.findUnique({
    where: { id: roundId },
    include: {
      prizes: {
        include: {
          prize: true,
          round: true
        },
      },
    },
  })

  if (!round) {
    throw new Error("Round not found")
  }

  // Calculate total prizes
  const totalPrizes = round.prizes.reduce((sum, prize) => sum + prize.quantity, 0)

  // Get winners for this round
  const roundWinners = await prisma.winner.findMany({
    where: { roundId },
    include: {
      prize: true,
      participant: true,
    },
  })

  // Group winners by prize
  const drawnPrizes: DrawnPrize[] = []
  roundWinners.forEach((winner) => {
    let drawnPrize = drawnPrizes.find((dp) => dp.prizeId === winner.prizeId)
    if (!drawnPrize) {
      drawnPrize = {
        prizeId: winner.prizeId,
        prizeName: winner.prize.name,
        winners: [],
      }
      drawnPrizes.push(drawnPrize)
    }
    drawnPrize.winners.push({
      id: winner.id,
      code: winner.participant.code,
      name: winner.participant.name,
      phone: winner.participant.phone,
      drawnAt: winner.drawnAt,
      prizeImageUrl: winner.prize.imageUrl,
    })
  })

  // Calculate remaining prizes by prize type
  const remainingByPrize = round.prizes.map((prizeDef) => {
    const drawnCount = roundWinners.filter((w) => w.prizeId === prizeDef.prizeId).length
    const remaining = prizeDef.quantity - drawnCount

    return {
      prizeId: prizeDef.prizeId,
      prizeName: prizeDef.prize.name,
      total: prizeDef.quantity,
      remaining: remaining,
    }
  })

  // Calculate total remaining prizes
  const totalRemaining = remainingByPrize.reduce((sum, prize) => sum + prize.remaining, 0)

  return {
    totalPrizes,
    remainingPrizes: {
      total: totalRemaining,
      byPrize: remainingByPrize,
    },
    drawnPrizes,
  }
}

export async function performDraw(roundId: string, prizeId: string) {
  try {
    // Get the round and prize information
    const round = await prisma.drawRound.findUnique({
      where: { id: roundId },
      include: {
        prizes: {
          where: { prizeId },
          include: { prize: true },
        },
      },
    })

    if (!round) {
      throw new Error("Round not found")
    }

    if (!round.isActive) {
      throw new Error("Round is not active")
    }

    const roundPrize = round.prizes[0]
    if (!roundPrize) {
      throw new Error("Prize not found in this round")
    }

    // Check remaining prize quantity
    const drawnCount = await prisma.winner.count({
      where: {
        roundId,
        prizeId
      }
    })

    if (drawnCount >= roundPrize.quantity) {
      throw new Error("Đã hết giải thưởng này trong lần quay này")
    }

    // Get all participants who have won any prize in this round
    const existingWinners = await prisma.winner.findMany({
      where: {
        roundId,
      },
      select: {
        participantId: true,
      },
    })

    const winnerIds = existingWinners.map((w) => w.participantId)

    // Get total participants in this round
    const totalParticipants = await prisma.participant.count({
      where: {
        roundId,
      }
    })

    // Get available participants for this round only, excluding those who have won any prize
    const availableParticipants = await prisma.participant.findMany({
      where: {
        roundId,
        id: { notIn: winnerIds }
      },
      select: {
        id: true,
        code: true
      }
    })

    // Check if there are any participants left
    if (availableParticipants.length === 0) {
      if (totalParticipants === 0) {
        throw new Error("Chưa có người tham gia nào trong lần quay này")
      } else {
        throw new Error("Tất cả người tham gia đã trúng thưởng")
      }
    }

    // Randomly select a winner
    const randomIndex = Math.floor(Math.random() * availableParticipants.length)
    const winner = availableParticipants[randomIndex]

    // Create winner record
    const newWinner = await prisma.winner.create({
      data: {
        roundId,
        prizeId,
        participantId: winner.id
      },
      include: {
        participant: {
          select: {
            code: true,
            name: true,
            phone: true
          }
        },
        prize: true,
      },
    })

    // Get updated statistics
    const statistics = await getRoundStatistics(roundId)

    return {
      winner: newWinner as unknown as Winner,
      statistics,
      winnerCode: winner.code
    }
  } catch (error) {
    console.error("Error performing draw:", error)
    throw error
  }
}

// Hàm để lấy đường dẫn background image
export async function getBackgroundImage() {
  return "/images/background.jpg";
}

// Hàm để cập nhật background image
export async function updateBackgroundImage(formData: FormData) {
  try {
    const file = formData.get("image") as File
    if (!file) throw new Error("No file uploaded")
    if (file.size > 5 * 1024 * 1024) throw new Error("File size must be less than 5MB")
    if (!file.type.startsWith("image/")) throw new Error("File must be an image")

    const uploadDir = join(process.cwd(), "public/images")
    try { await fs.access(uploadDir) } catch { await fs.mkdir(uploadDir, { recursive: true }) }

    const imagePath = join(uploadDir, "background.jpg")
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(imagePath, buffer)

    // Không cần update database nữa

    revalidatePath("/admin")
    revalidatePath("/draw")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating background image:", error)
    throw new Error(error.message || "Failed to update background image")
  }
}

export async function createDefaultPrizes() {
  try {
    // Xóa tất cả dữ liệu hiện có
    await prisma.winner.deleteMany();
    await prisma.roundPrize.deleteMany();
    await prisma.prize.deleteMany();
    await prisma.drawRound.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.settings.deleteMany();

    // Tạo settings mặc định
    await prisma.settings.create({
      data: {
        id: "1",
        backgroundImage: null
      }
    })

    // Tạo các giải thưởng
    const prizes = await Promise.all([
      // Giải nhất
      prisma.prize.create({
        data: {
          name: "Giải nhất",
          description: "1 giải nhất trị giá 10.000.000đ",
        }
      }),
      // Giải nhì
      prisma.prize.create({
        data: {
          name: "Giải nhì",
          description: "2 giải nhì, mỗi giải trị giá 5.000.000đ",
        }
      }),
      // Giải ba
      prisma.prize.create({
        data: {
          name: "Giải ba",
          description: "3 giải ba, mỗi giải trị giá 3.000.000đ",
        }
      }),
      // Giải khuyến khích
      prisma.prize.create({
        data: {
          name: "Giải khuyến khích",
          description: "10 giải khuyến khích, mỗi giải trị giá 500.000đ",
        }
      }),
    ]);

    // Tạo các lần quay
    const rounds = await Promise.all([
      // Lần 1
      prisma.drawRound.create({
        data: {
          name: "Lần 1",
          description: "10 giải khuyến khích, 1 giải ba",
          date: new Date(),
          order: 1,
          prizes: {
            create: [
              { prizeId: prizes[3].id, quantity: 10 }, // Khuyến khích
              { prizeId: prizes[2].id, quantity: 1 }, // Ba
            ]
          }
        }
      }),
      // Lần 2
      prisma.drawRound.create({
        data: {
          name: "Lần 2",
          description: "10 giải khuyến khích, 1 giải ba",
          date: new Date(),
          order: 2,
          prizes: {
            create: [
              { prizeId: prizes[3].id, quantity: 10 }, // Khuyến khích
              { prizeId: prizes[2].id, quantity: 1 }, // Ba
            ]
          }
        }
      }),
      // Lần 3
      prisma.drawRound.create({
        data: {
          name: "Lần 3",
          description: "10 giải khuyến khích, 1 giải ba, 1 giải nhì",
          date: new Date(),
          order: 3,
          prizes: {
            create: [
              { prizeId: prizes[3].id, quantity: 10 }, // Khuyến khích
              { prizeId: prizes[2].id, quantity: 1 }, // Ba
              { prizeId: prizes[1].id, quantity: 1 }, // Nhì
            ]
          }
        }
      }),
      // Lần 4
      prisma.drawRound.create({
        data: {
          name: "Lần 4",
          description: "10 giải khuyến khích, 1 giải nhì",
          date: new Date(),
          order: 4,
          prizes: {
            create: [
              { prizeId: prizes[3].id, quantity: 10 }, // Khuyến khích
              { prizeId: prizes[1].id, quantity: 1 }, // Nhì
            ]
          }
        }
      }),
      // Lần 5
      prisma.drawRound.create({
        data: {
          name: "Lần 5",
          description: "10 giải khuyến khích, 1 giải nhất",
          date: new Date(),
          order: 5,
          prizes: {
            create: [
              { prizeId: prizes[3].id, quantity: 10 }, // Khuyến khích
              { prizeId: prizes[0].id, quantity: 1 }, // Nhất
            ]
          }
        }
      }),
    ]);

    // Tạo participants ngẫu nhiên cho mỗi round
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      const roundNumber = i + 1;
      
      // Tạo 50 participants cho mỗi round
      const participantData = Array.from({ length: 50 }, (_, j) => ({
        code: `round${roundNumber}-${(10000001 + j).toString()}`,
        name: `Người tham gia ${j + 1}`,
        phone: `090${Math.random().toString().slice(2, 10)}`,
        roundId: round.id
      }));

      await prisma.participant.createMany({
        data: participantData
      });
    }

    revalidatePath("/admin");
    revalidatePath("/draw");
    return { success: true, prizes, rounds };
  } catch (error) {
    console.error("Error creating default prizes:", error);
    return { success: false, error: "Failed to create default prizes" };
  }
}

interface ParticipantData {
  code: string
  name: string
  phone: string
}

export async function uploadParticipants(roundId: string, participants: ParticipantData[]) {
  try {
    // Xóa tất cả winner của vòng này trước (để tránh lỗi foreign key)
    await prisma.winner.deleteMany({
      where: { roundId }
    })

    // Sau đó xóa tất cả participant của vòng này
    await prisma.participant.deleteMany({
      where: { roundId }
    })

    // Cuối cùng tạo lại participant mới
    await prisma.participant.createMany({
      data: participants.map(p => ({
        ...p,
        roundId
      }))
    })

    return { success: true }
  } catch (error) {
    console.error('Error uploading participants:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      throw new Error('Có mã số người tham gia bị trùng trong danh sách upload')
    }
    throw new Error('Có lỗi xảy ra khi upload danh sách người tham gia')
  }
}

export async function getRounds() {
  try {
    const rounds = await prisma.drawRound.findMany({
      where: {
        name: {
          not: 'Default Round'
        }
      },
      include: {
        participants: true,
        prizes: {
          include: {
            prize: true
          }
        },
        winners: {
          include: {
            participant: true,
            prize: true
          }
        }
      },
      orderBy: {
        order: 'asc',
      }
    })
    return rounds
  } catch (error) {
    console.error('Error getting rounds:', error)
    throw new Error('Có lỗi xảy ra khi lấy danh sách vòng quay')
  }
}

export async function checkAvailableParticipants(roundId: string) {
  try {
    // Get total participants in this round
    const totalParticipants = await prisma.participant.count({
      where: {
        roundId,
      }
    })

    if (totalParticipants === 0) {
      return { 
        canDraw: false, 
        message: "Chưa có người tham gia nào trong lần quay này" 
      }
    }

    // Get all participants who have won any prize in this round
    const winners = await prisma.winner.count({
      where: {
        roundId,
      }
    })

    if (winners >= totalParticipants) {
      return { 
        canDraw: false, 
        message: "Tất cả người tham gia đã trúng thưởng" 
      }
    }

    return { 
      canDraw: true 
    }
  } catch (error) {
    console.error("Error checking available participants:", error)
    throw error
  }
}
