import { create } from 'zustand'
import { WorkflowStep, DEFAULT_WORKFLOW, WorkflowMode } from '@/lib/workflow'

interface WorkflowState {
    isCollaborateMode: boolean
    mode: WorkflowMode
    steps: WorkflowStep[]
    activeStepId: string | null
    toggleCollaborateMode: () => void
    setMode: (mode: WorkflowMode) => void
    setSteps: (steps: WorkflowStep[]) => void
    updateStep: (stepId: string, updates: Partial<WorkflowStep>) => void
    resetWorkflow: () => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
    isCollaborateMode: false,
    mode: "auto",
    steps: DEFAULT_WORKFLOW,
    activeStepId: null,
    toggleCollaborateMode: () => set((state) => ({ isCollaborateMode: !state.isCollaborateMode })),
    setMode: (mode) => set({ mode }),
    setSteps: (steps) => set({ steps }),
    updateStep: (stepId, updates) => set((state) => ({
        steps: state.steps.map((step) =>
            step.id === stepId ? { ...step, ...updates } : step
        ),
    })),
    resetWorkflow: () => set({ steps: DEFAULT_WORKFLOW, activeStepId: null }),
}))
