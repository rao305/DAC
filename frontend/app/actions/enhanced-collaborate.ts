"use server"

/**
 * Server Actions for Enhanced Multi-Model Collaboration
 * 
 * These actions interface with the new enhanced collaboration pipeline
 * that includes multi-model external review and meta-synthesis.
 */

import {
  EnhancedCollaborateRequest,
  EnhancedCollaborateResponse,
  DEFAULT_ENHANCED_COLLAB_SETTINGS
} from '@/lib/orchestrator-types'

// Backend API URL (use environment variable or default)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Enhanced collaboration with multi-model council
 */
export async function enhancedCollaborate(
  message: string,
  options: {
    conversationId?: string
    enableExternalReview?: boolean
    reviewMode?: 'auto' | 'high_fidelity' | 'expert'
    userId?: string
  } = {}
): Promise<EnhancedCollaborateResponse> {
  try {
    const request: EnhancedCollaborateRequest = {
      message,
      conversation_id: options.conversationId,
      enable_external_review: options.enableExternalReview ?? DEFAULT_ENHANCED_COLLAB_SETTINGS.enable_external_review,
      review_mode: options.reviewMode ?? DEFAULT_ENHANCED_COLLAB_SETTINGS.review_mode,
      user_id: options.userId
    }

    console.log('[enhanced-collaborate] Starting enhanced collaboration:', {
      messageLength: message.length,
      conversationId: options.conversationId,
      enableExternalReview: request.enable_external_review,
      reviewMode: request.review_mode
    })

    const response = await fetch(`${API_BASE_URL}/api/collaborate/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': 'org_demo', // TODO: Get from auth context
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[enhanced-collaborate] API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      
      throw new Error(`Enhanced collaboration failed: ${response.status} ${response.statusText}`)
    }

    const result: EnhancedCollaborateResponse = await response.json()

    console.log('[enhanced-collaborate] Success:', {
      externalReviewConducted: result.external_review_conducted,
      reviewersConsulted: result.reviewers_consulted,
      totalTimeMs: result.total_time_ms,
      finalAnswerLength: result.final_answer.length,
      synthesisMeta: result.synthesis_metadata?.synthesis_type
    })

    return result

  } catch (error) {
    console.error('[enhanced-collaborate] Error:', error)
    throw error
  }
}

/**
 * Get collaboration settings info
 */
export async function getCollaborationInfo(): Promise<{
  available_providers: string[]
  review_modes: Array<{
    mode: 'auto' | 'high_fidelity' | 'expert'
    name: string
    description: string
  }>
  default_settings: typeof DEFAULT_ENHANCED_COLLAB_SETTINGS
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collaborate/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Org-Id': 'org_demo',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      // Fallback to defaults if info endpoint is not available
      return {
        available_providers: ['openai', 'gemini', 'perplexity', 'kimi', 'openrouter'],
        review_modes: [
          {
            mode: 'auto',
            name: 'Auto',
            description: 'External review triggered automatically based on confidence'
          },
          {
            mode: 'high_fidelity',
            name: 'High Fidelity',
            description: 'Always include external multi-model review'
          },
          {
            mode: 'expert',
            name: 'Expert',
            description: 'Maximum external reviewers + comprehensive analysis'
          }
        ],
        default_settings: DEFAULT_ENHANCED_COLLAB_SETTINGS
      }
    }

    return await response.json()
  } catch (error) {
    console.error('[enhanced-collaborate] Error getting collaboration info:', error)
    // Return fallback defaults
    return {
      available_providers: ['openai', 'gemini', 'perplexity', 'kimi', 'openrouter'],
      review_modes: [
        {
          mode: 'auto',
          name: 'Auto',
          description: 'External review triggered automatically based on confidence'
        },
        {
          mode: 'high_fidelity',
          name: 'High Fidelity',
          description: 'Always include external multi-model review'
        },
        {
          mode: 'expert',
          name: 'Expert',
          description: 'Maximum external reviewers + comprehensive analysis'
        }
      ],
      default_settings: DEFAULT_ENHANCED_COLLAB_SETTINGS
    }
  }
}