import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { uploadParticipants } from '@/lib/actions'

interface UploadParticipantsProps {
  roundId: string
  onSuccess?: () => void
}

export function UploadParticipants({ roundId, onSuccess }: UploadParticipantsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          // Validate data format
          const participants = jsonData.map((row: any) => {
            if (!row.code || !row.name || !row.phone) {
              throw new Error('File Excel phải có các cột: code, name, phone')
            }
            return {
              code: String(row.code),
              name: String(row.name),
              phone: String(row.phone)
            }
          })

          await uploadParticipants(roundId, participants)
          toast.success('Upload danh sách người tham gia thành công')
          onSuccess?.()
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý file')
        }
      }

      reader.onerror = () => {
        toast.error('Có lỗi xảy ra khi đọc file')
      }

      reader.readAsBinaryString(file)
    } catch (error) {
      toast.error('Có lỗi xảy ra khi upload file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/download-template')
      if (!response.ok) throw new Error('Có lỗi xảy ra khi tải file mẫu')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'participants-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải file mẫu')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="file">Upload danh sách người tham gia (Excel)</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
          >
            Tải file mẫu
          </Button>
        </div>
        <Input
          id="file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          File Excel phải có các cột: code, name, phone
        </p>
      </div>
    </div>
  )
} 