import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background.jpg" alt="Background" fill className="object-cover" priority />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 text-center text-blue-800">
        <h1 className="mb-6 text-5xl font-bold tracking-tight">TrueMoney+ Lucky Draw</h1>
        <p className="mb-8 max-w-md text-xl">
          Welcome to the TrueMoney+ lucky draw system. Click below to start the draw or access the admin panel.
        </p>
        <div className="flex gap-4">
          <Link href="/draw">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Draw
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-100">
              Admin Panel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
