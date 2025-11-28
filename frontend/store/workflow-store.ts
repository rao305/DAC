import { create } from 'zustand'
import { WorkflowStep, DEFAULT_WORKFLOW, WorkflowMode } from '@/lib/workflow'
import { 
    CollaborationPlan, 
    StepResult, 
    UserSettings, 
    UserPriority,
    DEFAULT_COLLAB_SETTINGS 
} from '@/lib/orchestrator-types'

// Collaboration mode: 'static' uses fixed roles, 'dynamic' uses orchestrator
type CollaborationMode = 'static' | 'dynamic'

interface DynamicCollaborationState {
    plan: CollaborationPlan | null
    stepResults: StepResult[]
    currentStepIndex: number
    isPlanning: boolean
    totalTimeMs: number
    turnId: string | null
}

interface WorkflowState {
    // Existing static workflow state
    isCollaborateMode: boolean
    mode: WorkflowMode
    steps: WorkflowStep[]
    activeStepId: string | null
    
    // Dynamic collaboration state
    collaborationMode: CollaborationMode
    dynamicState: DynamicCollaborationState
    userSettings: UserSettings
    
    // Static workflow actions
    toggleCollaborateMode: () => void
    setMode: (mode: WorkflowMode) => void
    setSteps: (steps: WorkflowStep[]) => void
    updateStep: (stepId: string, updates: Partial<WorkflowStep>) => void
    resetWorkflow: () => void
    
    // Dynamic collaboration actions
    setCollaborationMode: (mode: CollaborationMode) => void
    setUserSettings: (settings: Partial<UserSettings>) => void
    setUserPriority: (priority: UserPriority) => void
    
    // Dynamic state management
    startDynamicPlanning: () => void
    setPlan: (plan: CollaborationPlan) => void
    addStepResult: (result: StepResult) => void
    updateCurrentStep: (index: number) => void
    completeDynamicRun: (turnId: string, totalTimeMs: number) => void
    resetDynamicState: () => void
}

const initialDynamicState: DynamicCollaborationState = {
    plan: null,
    stepResults: [],
    currentStepIndex: 0,
    isPlanning: false,
    totalTimeMs: 0,
    turnId: null
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    // Initial static workflow state
    isCollaborateMode: false,
    mode: "auto",
    steps: DEFAULT_WORKFLOW,
    activeStepId: null,
    
    // Initial dynamic collaboration state
    collaborationMode: 'dynamic', // Default to dynamic
    dynamicState: initialDynamicState,
    userSettings: DEFAULT_COLLAB_SETTINGS,
    
    // =========================================================================
    // Static Workflow Actions (preserved for backward compatibility)
    // =========================================================================
    
    toggleCollaborateMode: () => set((state) => {
        // If turning collaborate mode off, reset everything
        if (state.isCollaborateMode) {
            console.log('🔄 Toggling collaborate mode off - resetting workflow')
            return { 
                isCollaborateMode: false,
                steps: DEFAULT_WORKFLOW,
                activeStepId: null,
                dynamicState: initialDynamicState
            }
        }
        // If turning collaborate mode on, just toggle it
        console.log('🔄 Toggling collaborate mode on')
        return { isCollaborateMode: true }
    }),
    
    setMode: (mode) => {
        const state = get()
        // Update all pending/running/awaiting_user steps to the new mode
        const updatedSteps = state.steps.map((step) => {
            if (step.status === "pending" || step.status === "running" || step.status === "awaiting_user") {
                return { ...step, mode }
            }
            return step
        })
        set({ mode, steps: updatedSteps })
        console.log(`🔄 Workflow mode changed to: ${mode}. Updated ${updatedSteps.filter(s => s.mode === mode && (s.status === "pending" || s.status === "running" || s.status === "awaiting_user")).length} steps.`)
    },
    
    setSteps: (steps) => set({ steps }),
    
    updateStep: (stepId, updates) => set((state) => ({
        steps: state.steps.map((step) =>
            step.id === stepId ? { ...step, ...updates } : step
        ),
    })),
    
    resetWorkflow: () => set({ 
        steps: DEFAULT_WORKFLOW, 
        activeStepId: null,
        dynamicState: initialDynamicState
    }),
    
    // =========================================================================
    // Dynamic Collaboration Actions
    // =========================================================================
    
    setCollaborationMode: (mode) => {
        console.log(`🔄 Collaboration mode set to: ${mode}`)
        set({ collaborationMode: mode })
    },
    
    setUserSettings: (settings) => set((state) => ({
        userSettings: { ...state.userSettings, ...settings }
    })),
    
    setUserPriority: (priority) => set((state) => ({
        userSettings: { ...state.userSettings, priority }
    })),
    
    // Dynamic state management
    startDynamicPlanning: () => set((state) => ({
        dynamicState: {
            ...state.dynamicState,
            isPlanning: true,
            plan: null,
            stepResults: [],
            currentStepIndex: 0
        }
    })),
    
    setPlan: (plan) => set((state) => ({
        dynamicState: {
            ...state.dynamicState,
            plan,
            isPlanning: false
        }
    })),
    
    addStepResult: (result) => set((state) => ({
        dynamicState: {
            ...state.dynamicState,
            stepResults: [...state.dynamicState.stepResults, result]
        }
    })),
    
    updateCurrentStep: (index) => set((state) => ({
        dynamicState: {
            ...state.dynamicState,
            currentStepIndex: index
        }
    })),
    
    completeDynamicRun: (turnId, totalTimeMs) => set((state) => ({
        dynamicState: {
            ...state.dynamicState,
            turnId,
            totalTimeMs,
            isPlanning: false
        }
    })),
    
    resetDynamicState: () => set({
        dynamicState: initialDynamicState
    })
}))

// ============================================================================
// Selectors
// ============================================================================

/**
 * Check if the workflow is using dynamic collaboration
 */
export const useIsDynamicCollaboration = () => {
    const collaborationMode = useWorkflowStore(state => state.collaborationMode)
    return collaborationMode === 'dynamic'
}

/**
 * Get the current plan from dynamic collaboration
 */
export const useDynamicPlan = () => {
    return useWorkflowStore(state => state.dynamicState.plan)
}

/**
 * Get all step results from dynamic collaboration
 */
export const useDynamicStepResults = () => {
    return useWorkflowStore(state => state.dynamicState.stepResults)
}

/**
 * Check if planning is in progress
 */
export const useIsPlanning = () => {
    return useWorkflowStore(state => state.dynamicState.isPlanning)
}

/**
 * Get the current step index being processed
 */
export const useCurrentStepIndex = () => {
    return useWorkflowStore(state => state.dynamicState.currentStepIndex)
}

/**
 * Get user settings for collaboration
 */
export const useCollaborationSettings = () => {
    return useWorkflowStore(state => state.userSettings)
}

/**
 * Get computed progress percentage
 */
export const useCollaborationProgress = () => {
    const { plan, stepResults, isPlanning } = useWorkflowStore(state => state.dynamicState)
    
    if (isPlanning) return 5 // Show small progress during planning
    if (!plan) return 0
    
    const totalSteps = plan.steps.length
    const completedSteps = stepResults.length
    
    // Planning is 10%, each step is even portion of remaining 90%
    const planningProgress = 10
    const stepProgress = (completedSteps / totalSteps) * 90
    
    return Math.min(100, planningProgress + stepProgress)
}
