import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()
    
    // Create sample data
    const data = [
      { code: '10000001', name: 'Nguyễn Văn A', phone: '0901234567' },
      { code: '10000002', name: 'Trần Thị B', phone: '0901234568' },
      { code: '10000003', name: 'Lê Văn C', phone: '0901234569' }
    ]
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants')
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="participants-template.xlsx"'
      }
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo file mẫu' },
      { status: 500 }
    )
  }
} 