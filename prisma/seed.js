const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Xóa toàn bộ dữ liệu cũ
  await prisma.winner.deleteMany()
  await prisma.roundPrize.deleteMany()
  await prisma.prize.deleteMany()
  await prisma.drawRound.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.settings.deleteMany()

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
        description: "Giải nhất",
      }
    }),
    // Giải nhì
    prisma.prize.create({
      data: {
        name: "Giải nhì",
        description: "Giải nhì",
      }
    }),
    // Giải ba
    prisma.prize.create({
      data: {
        name: "Giải ba",
        description: "Giải ba",
      }
    }),
    // Giải khuyến khích
    prisma.prize.create({
      data: {
        name: "Giải khuyến khích",
        description: "Giải khuyến khích",
      }
    }),
  ])

  // Tạo các lần quay
  const rounds = []
  
  // Lần 1
  const round1 = await prisma.drawRound.create({
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
  })
  rounds.push(round1)

  // Lần 2
  const round2 = await prisma.drawRound.create({
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
  })
  rounds.push(round2)

  // Lần 3
  const round3 = await prisma.drawRound.create({
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
  })
  rounds.push(round3)

  // Lần 4
  const round4 = await prisma.drawRound.create({
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
  })
  rounds.push(round4)

  // Lần 5
  const round5 = await prisma.drawRound.create({
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
  })
  rounds.push(round5)

  console.log('Database has been seeded. 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 