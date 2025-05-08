import { type NextRequest, NextResponse } from "next/server"
import { performDraw } from "@/lib/actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const roundId = searchParams.get("roundId")
  const prizeId = searchParams.get("prizeId")

  if (!roundId || !prizeId) {
    return NextResponse.json({ error: "Round ID and Prize ID are required" }, { status: 400 })
  }

  try {
    // Perform the draw
    const result = await performDraw(roundId, prizeId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error during draw:", error)
    return NextResponse.json({ error: "Failed to perform draw" }, { status: 500 })
  }
}
