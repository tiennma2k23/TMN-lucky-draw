"use client"

import { useRef, useEffect } from "react"
import type { Prize } from "@/lib/types"

interface DrawWheelProps {
  isActive: boolean
  selectedPrize: Prize | null
  winnerCode?: string
}

export default function DrawWheel({ isActive, selectedPrize, winnerCode }: DrawWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestIdRef = useRef<number>()
  const numbersRef = useRef<string[]>([])
  const speedRef = useRef(0)
  const maxSpeedRef = useRef(50)
  const decelerationRef = useRef(0.95)
  const isDeceleratingRef = useRef(false)
  const startTimeRef = useRef(0)

  // Generate random numbers for animation
  useEffect(() => {
    // Generate a pool of random numbers to use in the animation
    const generateNumbers = () => {
      const numbers: string[] = []
      for (let i = 0; i < 100; i++) {
        // Generate a random number with the configured length
        const length = 8 // This would come from settings in a real implementation
        let num = ""
        for (let j = 0; j < length; j++) {
          num += Math.floor(Math.random() * 10)
        }
        numbers.push(num)
      }
      return numbers
    }

    numbersRef.current = generateNumbers()
  }, [])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawFrame = () => {
      if (!canvas) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set text properties
      ctx.font = "bold 48px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Draw numbers
      const centerY = canvas.height / 2
      const centerX = canvas.width / 2

      if (isActive) {
        // When active, show spinning numbers
        if (!isDeceleratingRef.current && speedRef.current < maxSpeedRef.current) {
          speedRef.current += 2
        }

        if (isDeceleratingRef.current) {
          speedRef.current *= decelerationRef.current

          if (speedRef.current < 0.5) {
            speedRef.current = 0
          }
        }

        // Start deceleration after 3 seconds
        if (isActive && !isDeceleratingRef.current && Date.now() - startTimeRef.current > 3000) {
          isDeceleratingRef.current = true
        }

        // Get a random number from our pool based on the current time
        const index = Math.floor(Date.now() / (100 - speedRef.current)) % numbersRef.current.length
        const displayNumber = numbersRef.current[index]

        // Draw with a glowing effect
        ctx.shadowColor = "rgba(0, 0, 255, 0.8)"
        ctx.shadowBlur = 15
        ctx.fillStyle = "#1E40AF" // Blue color
        ctx.fillText(displayNumber, centerX, centerY)
        ctx.shadowBlur = 0
      } else {
        // When inactive, show placeholder or selected prize
        ctx.fillStyle = "#1E40AF"
        if (winnerCode) {
          ctx.fillText(winnerCode, centerX, centerY)
        } else {
          ctx.fillText(selectedPrize ? selectedPrize.name : "Select a prize", centerX, centerY)
        }
      }

      requestIdRef.current = requestAnimationFrame(drawFrame)
    }

    if (isActive) {
      // Reset animation state when starting
      speedRef.current = 0
      isDeceleratingRef.current = false
      startTimeRef.current = Date.now()
    }

    requestIdRef.current = requestAnimationFrame(drawFrame)

    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current)
      }
    }
  }, [isActive, selectedPrize, winnerCode])

  return (
    <div className="relative flex h-64 w-full max-w-2xl items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-300 to-blue-400 p-4 shadow-lg">
      <canvas ref={canvasRef} width={600} height={200} className="h-full w-full" />
    </div>
  )
}
