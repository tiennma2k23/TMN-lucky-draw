import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    // Get all participants
    const participants = await prisma.participant.findMany({
      include: {
        winners: {
          include: {
            round: true,
            prize: true
          }
        }
      }
    })

    // Prepare data for Excel
    const data = participants.map((participant) => ({
      "Mã số": participant.code,
      "Tên": participant.name,
      "Số điện thoại": participant.phone,
      "Trạng thái": participant.winners.length > 0 ? "Đã trúng thưởng" : "Chưa trúng thưởng"
    }))

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="participants_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error exporting participants:", error)
    return NextResponse.json({ error: "Failed to export participants" }, { status: 500 })
  }
} 