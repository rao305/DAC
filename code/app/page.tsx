import { Hero } from "@/components/hero"
import { ProblemSolution } from "@/components/problem-solution"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { UseCases } from "@/components/use-cases"
import { Pricing } from "@/components/pricing"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  )
}
