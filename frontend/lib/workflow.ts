export type WorkflowRole = "analyst" | "researcher" | "creator" | "critic" | "synthesizer";
export type WorkflowModel = "gpt" | "gemini" | "perplexity" | "kimi";
export type WorkflowMode = "manual" | "auto";
export type WorkflowStatus = "pending" | "running" | "awaiting_user" | "done" | "error" | "cancelled";

export type WorkflowStep = {
    id: string;
    role: WorkflowRole;
    model: WorkflowModel;
    mode: WorkflowMode;
    status: WorkflowStatus;
    inputContext: string;
    outputDraft?: string;
    outputFinal?: string;
    metadata?: {
        isMock?: boolean;
        providerName?: string;
    };
    error?: {
        message: string;
        provider?: string;
        type?: "config" | "network" | "rate_limit" | "unknown";
    };
};

export const DEFAULT_WORKFLOW: WorkflowStep[] = [
    { id: "analyst", role: "analyst", model: "gemini", mode: "manual", status: "pending", inputContext: "" },
    { id: "researcher", role: "researcher", model: "perplexity", mode: "auto", status: "pending", inputContext: "" },
    { id: "creator", role: "creator", model: "gpt", mode: "manual", status: "pending", inputContext: "" },
    { id: "critic", role: "critic", model: "gpt", mode: "manual", status: "pending", inputContext: "" },
    { id: "synth", role: "synthesizer", model: "gpt", mode: "auto", status: "pending", inputContext: "" },
];
