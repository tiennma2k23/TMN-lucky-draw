import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateRounds() {
  try {
    // Get all rounds ordered by name
    const rounds = await prisma.drawRound.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    // Update each round with its order
    for (let i = 0; i < rounds.length; i++) {
      await prisma.drawRound.update({
        where: { id: rounds[i].id },
        data: { order: i + 1 }
      })
    }

    console.log('Successfully updated rounds order')
  } catch (error) {
    console.error('Error updating rounds:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateRounds() 