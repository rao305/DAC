"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clock, Users, Brain, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { EnhancedMessageContent } from "@/components/enhanced-message-content"
import { 
  EnhancedCollaborateResponse,
  ExternalReview,
  SynthesisMetadata,
  formatReviewerName,
  getSynthesisTypeDisplay,
  formatExecutionTime
} from "@/lib/orchestrator-types"

interface EnhancedCollaborationDisplayProps {
  result: EnhancedCollaborateResponse
  timestamp?: string
}

export function EnhancedCollaborationDisplay({ 
  result, 
  timestamp 
}: EnhancedCollaborationDisplayProps) {
  const [showInternalReport, setShowInternalReport] = useState(false)
  const [showExternalReviews, setShowExternalReviews] = useState(false)
  const [showSynthesisDetails, setShowSynthesisDetails] = useState(false)

  const successfulReviews = result.external_critiques.filter(r => r.status === 'success')
  const failedReviews = result.external_critiques.filter(r => r.status === 'failed')

  return (
    <div className="space-y-4">
      {/* Main Answer */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Collaborative Response
              </h3>
              {result.external_review_conducted && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded-full">
                  <Users className="w-3 h-3 text-purple-600" />
                  <span className="text-xs text-purple-700 font-medium">
                    Council Reviewed
                  </span>
                </div>
              )}
            </div>
            {timestamp && (
              <div className="flex items-center space-x-1 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>{timestamp}</span>
              </div>
            )}
          </div>

          <EnhancedMessageContent content={result.final_answer} />

          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatExecutionTime(result.total_time_ms)}</span>
            </div>
            {result.external_review_conducted && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{result.reviewers_consulted} reviewers</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-2">
        {/* External Reviews Section */}
        {result.external_review_conducted && (
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setShowExternalReviews(!showExternalReviews)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">
                  Multi-Model Reviews ({successfulReviews.length})
                </span>
                {failedReviews.length > 0 && (
                  <span className="text-sm text-amber-600">
                    ({failedReviews.length} failed)
                  </span>
                )}
              </div>
              {showExternalReviews ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {showExternalReviews && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-3 mt-3">
                  {successfulReviews.map((review, index) => (
                    <ExternalReviewCard key={index} review={review} />
                  ))}
                  {failedReviews.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-amber-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {failedReviews.length} reviewer(s) unavailable
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Synthesis Details */}
        {result.synthesis_metadata && (
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setShowSynthesisDetails(!showSynthesisDetails)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Synthesis Analysis</span>
                <SynthesisStatusBadge metadata={result.synthesis_metadata} />
              </div>
              {showSynthesisDetails ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {showSynthesisDetails && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <SynthesisDetailsCard metadata={result.synthesis_metadata} />
              </div>
            )}
          </div>
        )}

        {/* Internal Report Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <button
            onClick={() => setShowInternalReport(!showInternalReport)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Internal Team Report</span>
              <span className="text-sm text-gray-500">(5-stage pipeline)</span>
            </div>
            {showInternalReport ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          {showInternalReport && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-3 prose prose-sm max-w-none">
                <EnhancedMessageContent content={result.internal_report} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExternalReviewCard({ review }: { review: ExternalReview }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-gray-900 text-sm">
          {formatReviewerName(review.reviewer, review.provider)}
        </div>
        <div className="text-xs text-gray-500 capitalize">
          {review.provider}
        </div>
      </div>
      <div className="text-sm text-gray-700 prose prose-sm max-w-none">
        <EnhancedMessageContent content={review.critique} />
      </div>
    </div>
  )
}

function SynthesisStatusBadge({ metadata }: { metadata: SynthesisMetadata }) {
  const display = getSynthesisTypeDisplay(metadata.synthesis_type)
  
  return (
    <div 
      className="px-2 py-1 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: display.color + '20', 
        color: display.color 
      }}
    >
      {display.name}
    </div>
  )
}

function SynthesisDetailsCard({ metadata }: { metadata: SynthesisMetadata }) {
  const typeDisplay = getSynthesisTypeDisplay(metadata.synthesis_type)
  
  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600 font-medium mb-1">Synthesis Type</div>
          <div className="text-gray-900">{typeDisplay.name}</div>
          <div className="text-gray-500 text-xs mt-1">{typeDisplay.description}</div>
        </div>
        <div>
          <div className="text-gray-600 font-medium mb-1">Primary Improvement</div>
          <div className="text-gray-900 capitalize">
            {metadata.primary_improvement.replace('_', ' ')}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600 font-medium mb-1">Confidence Level</div>
          <div className={cn(
            "font-medium",
            metadata.confidence_level === 'high' && "text-green-600",
            metadata.confidence_level === 'medium' && "text-yellow-600",
            metadata.confidence_level === 'low' && "text-red-600"
          )}>
            {metadata.confidence_level.charAt(0).toUpperCase() + metadata.confidence_level.slice(1)}
          </div>
        </div>
        <div>
          <div className="text-gray-600 font-medium mb-1">Status</div>
          <div className="flex items-center space-x-1">
            {metadata.synthesis_status === 'success' ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-600" />
            )}
            <span className={cn(
              "text-sm font-medium",
              metadata.synthesis_status === 'success' && "text-green-600",
              metadata.synthesis_status === 'failed' && "text-red-600"
            )}>
              {metadata.synthesis_status.charAt(0).toUpperCase() + metadata.synthesis_status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {metadata.fallback_used && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm">
          <div className="flex items-center space-x-1 text-amber-800">
            <AlertCircle className="w-3 h-3" />
            <span className="font-medium">Fallback Mode</span>
          </div>
          <div className="text-amber-700 text-xs mt-1">
            Meta-synthesis failed, using internal report as final answer
          </div>
        </div>
      )}
    </div>
  )
}