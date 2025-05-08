import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.winner.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.roundPrize.deleteMany()
  await prisma.prize.deleteMany()
  await prisma.drawRound.deleteMany()
  await prisma.settings.deleteMany()

  // Create prizes
  const prizes = await Promise.all([
    prisma.prize.create({
      data: {
        name: "Doraemon Plush",
        description: "Gấu bông Doraemon cao cấp",
        imageUrl: "/images/prizes/doraemon-plush.jpg",
      },
    }),
    prisma.prize.create({
      data: {
        name: "Doraemon Keychain",
        description: "Móc khóa Doraemon",
        imageUrl: "/images/prizes/doraemon-keychain.jpg",
      },
    }),
    prisma.prize.create({
      data: {
        name: "Doraemon T-shirt",
        description: "Áo thun Doraemon",
        imageUrl: "/images/prizes/doraemon-tshirt.jpg",
      },
    }),
  ])

  // Create draw rounds
  const rounds = await Promise.all([
    prisma.drawRound.create({
      data: {
        name: "Lần 1",
        description: "Quay thưởng lần 1",
        date: new Date("2024-03-20"),
        isActive: true,
        prizes: {
          create: [
            { prizeId: prizes[0].id, quantity: 1 }, // 1 Doraemon Plush
            { prizeId: prizes[1].id, quantity: 2 }, // 2 Doraemon Keychain
            { prizeId: prizes[2].id, quantity: 3 }, // 3 Doraemon T-shirt
          ],
        },
      },
    }),
    prisma.drawRound.create({
      data: {
        name: "Lần 2",
        description: "Quay thưởng lần 2",
        date: new Date("2024-03-21"),
        isActive: false,
        prizes: {
          create: [
            { prizeId: prizes[0].id, quantity: 1 }, // 1 Doraemon Plush
            { prizeId: prizes[1].id, quantity: 2 }, // 2 Doraemon Keychain
          ],
        },
      },
    }),
  ])

  // Create participants with 8-digit codes
  const participants = await Promise.all(
    Array.from({ length: 50 }, (_, i) => {
      const code = String(10000001 + i).padStart(8, "0")
      return prisma.participant.create({
        data: {
          code,
          name: `Người tham gia ${i + 1}`,
          phone: `0123456${String(i + 1).padStart(4, "0")}`,
        },
      })
    })
  )

  // Create settings
  await prisma.settings.create({
    data: {
      currentRoundId: rounds[0].id,
    },
  })

  console.log("Seed data created successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 