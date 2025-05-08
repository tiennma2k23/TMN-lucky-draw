// Mock data for the lucky draw system
const participants = Array.from({ length: 100 }).map((_, i) => ({
  id: `p${i + 1}`,
  code: `CODE${String(i + 1).padStart(6, "0")}`,
  name: `Participant ${i + 1}`,
  phone: `0901xxx${String(i + 1).padStart(3, "0")}`,
  isDrawn: false,
}))

export async function mockDraw(prizeId: string) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Get undrawn participants - for demo purposes, we'll always have participants available
  const availableParticipants = participants.filter((p) => !p.isDrawn)

  // If no participants are available, reset all participants to undrawn
  if (availableParticipants.length === 0) {
    participants.forEach((p) => (p.isDrawn = false))
  }

  // Get the updated list of available participants
  const updatedAvailableParticipants = participants.filter((p) => !p.isDrawn)

  // Select a random participant
  const randomIndex = Math.floor(Math.random() * updatedAvailableParticipants.length)
  const winner = updatedAvailableParticipants[randomIndex]

  // Mark as drawn
  const participantIndex = participants.findIndex((p) => p.id === winner.id)
  if (participantIndex !== -1) {
    participants[participantIndex].isDrawn = true
  }

  return winner
}
