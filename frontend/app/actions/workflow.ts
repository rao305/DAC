"use server"

import { WorkflowStep, DEFAULT_WORKFLOW, WorkflowRole } from "@/lib/workflow"
import { callGPT, callGemini, callPerplexity, callKimi, ModelResponse } from "@/lib/models"

// System prompts for each role
const PROMPTS = {
    analyst: `You are an expert Analyst in a collaborative AI team. Your goal is to deeply understand the user's request.
    
    Output Requirements:
    1.  **Deconstruct the Request**: Break down the user's query into core components and implicit needs.
    2.  **Identify Constraints**: List any technical, logical, or creative constraints.
    3.  **Edge Cases**: Anticipate potential pitfalls or edge cases.
    4.  **Strategic Direction**: Propose a high-level strategy for the team to follow.
    
    Format your response as a structured markdown report. Be comprehensive.`,

    researcher: `You are an expert Researcher in a collaborative AI team. Your goal is to gather factual information to support the Analyst's strategy.
    
    Output Requirements:
    1.  **Targeted Search**: Based on the Analyst's breakdown, simulate a search for the most relevant, up-to-date information.
    2.  **Key Findings**: Summarize the top 3-5 key facts, libraries, or concepts found.
    3.  **Technical Details**: Provide specific version numbers, API details, or syntax examples if relevant.
    4.  **Sources**: List simulated URLs for the information.
    
    Do not answer the final user question directly. Focus purely on providing raw, high-quality data for the Creator.`,

    creator: `You are an expert Creator in a collaborative AI team. Your goal is to synthesize the Analyst's strategy and the Researcher's data into a concrete solution.
    
    Output Requirements:
    1.  **Solution Design**: Create a detailed plan or architecture based on the analysis and research.
    2.  **Implementation**: Write the actual code, draft, or content. Use clean, commented, and professional syntax.
    3.  **Explanation**: Explain *why* you made specific choices, referencing the research findings.
    
    Be bold and creative. Produce a high-quality draft that is ready for critique.`,

    critic: `You are an expert Critic in a collaborative AI team. Your goal is to refine the Creator's work.
    
    Output Requirements:
    1.  **Logic Check**: Identify any logical fallacies or bugs in the Creator's solution.
    2.  **Safety & Security**: Check for vulnerabilities or unsafe practices.
    3.  **Optimization**: Suggest specific improvements for performance or readability.
    4.  **Constructive Feedback**: Be tough but fair. If the solution is great, validate it but suggest one "stretch" improvement.`,

    synthesizer: `You are an expert Synthesizer in a collaborative AI team. Your goal is to deliver the final answer to the user.
    
    Output Requirements:
    1.  **Executive Summary**: A concise answer to the user's original request.
    2.  **Final Solution**: Present the polished code, content, or plan, incorporating the Creator's work and the Critic's improvements.
    3.  **Rationale**: Briefly explain how the team arrived at this solution.
    4.  **Next Steps**: Suggest actionable next steps for the user.
    
    Your output should be the definitive, high-quality response the user sees.`
}

export async function startWorkflow(userMessage: string) {
    const steps = JSON.parse(JSON.stringify(DEFAULT_WORKFLOW)) as WorkflowStep[]

    // Initialize first step
    steps[0].status = "running"
    steps[0].inputContext = userMessage

    return steps
}

export async function runStep(stepId: string, inputContext: string, previousSteps: WorkflowStep[] = []) {
    const step = previousSteps.find(s => s.id === stepId)
    if (!step) throw new Error(`Step ${stepId} not found`)

    const role = step.role
    const model = step.model
    const systemPrompt = PROMPTS[role]

    // Construct context from previous steps
    let fullContext = `User Request: ${inputContext}\n\n`

    previousSteps.forEach(s => {
        if ((s.status === "done" || s.status === "awaiting_user") && s.outputFinal) {
            fullContext += `\n\n--- [${s.role.toUpperCase()}] Output ---\n${s.outputFinal}\n`
        }
    })

    let result = ""
    let isMock = false
    let errorDetails: WorkflowStep['error'] = undefined

    console.log(`[runStep] Starting step ${stepId} (${role})`)
    console.log(`[runStep] Env check: NODE_ENV=${process.env.NODE_ENV}, MOCK=${process.env.DAC_FORCE_MOCK}`)

    try {
        const timeoutPromise = new Promise<ModelResponse>((_, reject) => {
            setTimeout(() => reject(new Error("Step execution timed out")), 45000); // 45s strict timeout
        });

        let responsePromise: Promise<ModelResponse> | undefined;

        if (model === "gpt") {
            responsePromise = callGPT([
                { role: "system", content: systemPrompt },
                { role: "user", content: fullContext }
            ])
        } else if (model === "gemini") {
            responsePromise = callGemini(`${systemPrompt}\n\n${fullContext}`)
        } else if (model === "perplexity") {
            responsePromise = callPerplexity([
                { role: "system", content: systemPrompt },
                { role: "user", content: fullContext }
            ])
        } else if (model === "kimi") {
            responsePromise = callKimi([
                { role: "system", content: systemPrompt },
                { role: "user", content: fullContext }
            ])
        }

        if (responsePromise) {
            const response = await Promise.race([responsePromise, timeoutPromise]);

            if (response) {
                result = response.content
                isMock = !!response.isMock
                if (response.error) {
                    errorDetails = {
                        message: response.error,
                        provider: model,
                        type: "unknown"
                    }
                }
            }
        }
    } catch (e: any) {
        console.error(`Step ${stepId} failed:`, e)
        errorDetails = {
            message: e.message || "Unknown error",
            provider: model,
            type: e.name === "ProviderConfigError" ? "config" : "network"
        }
    }

    if (errorDetails) {
        return {
            outputDraft: "",
            status: "error" as const,
            error: errorDetails,
            metadata: {
                isMock,
                providerName: model
            }
        }
    }

    return {
        outputDraft: result,
        status: step.mode === "auto" ? "done" : "awaiting_user",
        metadata: {
            isMock,
            providerName: model
        }
    }
}
