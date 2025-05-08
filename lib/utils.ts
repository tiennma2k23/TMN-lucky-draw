import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hàm để che số điện thoại khi hiển thị
export function maskPhoneNumber(phone: string): string {
  if (!phone) return ""

  // Giữ 4 số đầu và 3 số cuối, che giữa bằng xxx
  if (phone.length > 7) {
    const firstPart = phone.substring(0, 4)
    const lastPart = phone.substring(phone.length - 3)
    return `${firstPart}xxx${lastPart}`
  }

  return phone
}
