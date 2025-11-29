import { startWorkflow, runStep } from "../app/actions/workflow"
import type { WorkflowStep } from "../lib/workflow"

/**
 * Simple script to run the collaborative workflow end-to-end using mock providers.
 * Requires DAC_FORCE_MOCK=1 so that provider calls return simulated content.
 */
async function runWorkflowTest() {
  const userMessage = "Explain the concept of vector embeddings, compare 3 real-world use cases, and provide a concise Python demo."

  console.log("🧪 Starting workflow test with mock providers...")
  console.log("📥 User message:", userMessage)

  const initialSteps = await startWorkflow(userMessage)
  let localSteps: WorkflowStep[] = [...initialSteps]

  for (let i = 0; i < localSteps.length; i++) {
    const step = localSteps[i]
    console.log(`\n🔹 Step ${i + 1}/${localSteps.length}: ${step.role.toUpperCase()} (model: ${step.model})`)

    const result = await runStep(step.id, userMessage, localSteps)

    // Update local step with results
    localSteps = localSteps.map((s) =>
      s.id === step.id
        ? ({
            ...s,
            outputDraft: result.outputDraft,
            outputFinal: result.outputDraft,
            status: result.status as WorkflowStep["status"],
            metadata: result.metadata,
            error: result.error
          } as WorkflowStep)
        : s
    )

    if (result.error) {
      console.error(`❌ Step ${step.id} failed:`, result.error)
      return
    }

    if (result.status === "awaiting_user") {
      console.log("⏸️ Step awaiting user approval - auto-approving for test...")
      localSteps = localSteps.map((s) =>
        s.id === step.id
          ? ({
              ...s,
              status: "done",
              outputFinal: result.outputDraft || s.outputDraft
            } as WorkflowStep)
          : s
      )
    }

    console.log(`✅ Step ${step.id} completed. Output preview:\n${(result.outputDraft || "").slice(0, 150)}...\n`)
  }

  console.log("\n🏁 Workflow completed. Summary:")
  localSteps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.role.toUpperCase()} (${step.model}) - status: ${step.status}`)
  })

  const finalOutput = localSteps
    .filter((s) => s.outputFinal)
    .map((s) => `### ${s.role.toUpperCase()} (${s.model})\n${s.outputFinal}`)
    .join("\n\n")

  console.log("\n🧾 Final synthesized output:\n")
  console.log(finalOutput)
}

runWorkflowTest().catch((err) => {
  console.error("Workflow test failed:", err)
  process.exit(1)
})

