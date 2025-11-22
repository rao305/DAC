// Core types for AI benchmark evaluation system
export interface BenchmarkMetric {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, sum should equal 1
  maxScore: number;
}

export interface ModelResponse {
  id: string;
  modelName: string;
  response: string;
  timestamp: Date;
  tokenCount?: number;
  responseTime?: number;
  cost?: number;
}

export interface BenchmarkScore {
  metricId: string;
  score: number;
  maxScore: number;
  notes?: string;
  evidence?: string[];
}

export interface BenchmarkResult {
  id: string;
  promptId: string;
  modelId: string;
  scores: BenchmarkScore[];
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  evaluatedBy: string;
  evaluatedAt: Date;
  qualitativeNotes?: string;
}

export interface TestPrompt {
  id: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  prompt: string;
  description: string;
  expectedOutcomes: string[];
  evaluationCriteria: string[];
  timeoutMinutes: number;
}

export interface ComparisonAnalysis {
  promptId: string;
  collaborativeResult: BenchmarkResult;
  individualResults: BenchmarkResult[];
  improvement: {
    absoluteGain: number;
    percentageGain: number;
    significantMetrics: string[];
  };
  insights: string[];
  recommendations: string[];
}

// Quality dimensions from your framework
export const QUALITY_METRICS: BenchmarkMetric[] = [
  {
    id: 'depth',
    name: 'Depth of Understanding',
    description: 'Demonstrates deeper conceptual reasoning beyond surface-level responses',
    weight: 0.15,
    maxScore: 10
  },
  {
    id: 'structure',
    name: 'Structure & Clarity',
    description: 'Clean organization, logical flow, easy to follow',
    weight: 0.12,
    maxScore: 10
  },
  {
    id: 'accuracy',
    name: 'Accuracy & Factuality',
    description: 'Real sources, current data, no hallucinations',
    weight: 0.15,
    maxScore: 10
  },
  {
    id: 'creativity',
    name: 'Creativity & Novelty',
    description: 'Original ideas, creative analogies, innovative solutions',
    weight: 0.10,
    maxScore: 10
  },
  {
    id: 'criticism',
    name: 'Critical Analysis',
    description: 'Identifies gaps, ethical issues, risks, alternative perspectives',
    weight: 0.13,
    maxScore: 10
  },
  {
    id: 'perspective',
    name: 'Multimodal Perspective',
    description: 'Multiple angles, feels like team collaboration',
    weight: 0.10,
    maxScore: 10
  },
  {
    id: 'consistency',
    name: 'Consistency',
    description: 'No contradictions, coherent logic, unified tone',
    weight: 0.08,
    maxScore: 10
  },
  {
    id: 'actionability',
    name: 'Actionability',
    description: 'Clear steps, frameworks, practical guidance',
    weight: 0.12,
    maxScore: 10
  },
  {
    id: 'breadth',
    name: 'Breadth & Depth Balance',
    description: 'Comprehensive coverage with deep exploration',
    weight: 0.05,
    maxScore: 10
  }
];

export const TEST_PROMPTS: TestPrompt[] = [
  {
    id: 'product-design',
    title: 'Complex Product Design - MindTrack App',
    category: 'Product Strategy',
    difficulty: 'expert',
    prompt: `I want to build an app called MindTrack that helps people stop procrastination using behavioral psychology.

Give me a full product blueprint including:
* problem analysis
* user archetypes  
* scientific research
* feature design
* UI flows
* business model
* risks
* ethical concerns
* 30-day launch roadmap

Final answer must feel like a combined expert team collaborated.`,
    description: 'Tests comprehensive product strategy with multi-disciplinary requirements',
    expectedOutcomes: [
      'Detailed problem analysis with behavioral psychology research',
      'Well-defined user personas with psychological profiles',
      'Evidence-based feature design',
      'Complete business model with monetization strategy',
      'Risk assessment and ethical considerations',
      'Actionable 30-day roadmap'
    ],
    evaluationCriteria: [
      'Scientific accuracy of psychological principles',
      'Feasibility of technical implementation',
      'Completeness of business strategy',
      'Ethical considerations depth',
      'Roadmap practicality'
    ],
    timeoutMinutes: 15
  },
  {
    id: 'api-ratelimiter',
    title: 'Scalable API Rate Limiter',
    category: 'Technical Implementation',
    difficulty: 'hard',
    prompt: `Write a scalable API rate-limiter in Node.js + Redis.

Steps needed from the team:
* Analyst: break down requirements
* Researcher: find 2024 best practices  
* Creator: write the code + architecture
* Critic: review for race conditions and security flaws
* Synthesizer: merge everything into final answer.`,
    description: 'Tests technical implementation with security and scalability considerations',
    expectedOutcomes: [
      'Complete rate limiter implementation',
      'Scalable architecture design',
      'Security vulnerability analysis',
      'Performance considerations',
      'Production-ready code'
    ],
    evaluationCriteria: [
      'Code quality and best practices',
      'Security vulnerability identification',
      'Scalability design',
      'Error handling completeness',
      'Documentation quality'
    ],
    timeoutMinutes: 20
  },
  {
    id: 'market-analysis-pitch',
    title: 'Wearable Tech Market Analysis + Innovation Pitch',
    category: 'Market Research',
    difficulty: 'hard',
    prompt: `Give me a 2024-2025 market analysis of wearable fitness tech, then turn it into a pitch for a new smartwatch feature Apple hasn't built yet.`,
    description: 'Tests research capabilities combined with creative innovation',
    expectedOutcomes: [
      'Current market analysis with real data',
      'Trend identification and forecasting',
      'Novel feature concept',
      'Competitive analysis',
      'Compelling pitch presentation'
    ],
    evaluationCriteria: [
      'Data accuracy and recency',
      'Market insight depth',
      'Innovation uniqueness',
      'Pitch persuasiveness',
      'Technical feasibility'
    ],
    timeoutMinutes: 12
  },
  {
    id: 'ethical-social-app',
    title: 'Ethical AI Social App Design',
    category: 'Ethics & Design',
    difficulty: 'expert',
    prompt: `Design a social app that uses AI to connect people with similar interests.

Include:
* privacy safeguards
* abuse prevention  
* regulatory compliance
* bias mitigation
* UX considerations

Critic should identify ethical risks.`,
    description: 'Tests ethical AI design with comprehensive risk analysis',
    expectedOutcomes: [
      'Privacy-first architecture',
      'Comprehensive abuse prevention',
      'Regulatory compliance strategy',
      'Bias detection and mitigation',
      'Ethical risk assessment'
    ],
    evaluationCriteria: [
      'Privacy protection robustness',
      'Ethical risk identification',
      'Regulatory understanding',
      'UX balance with safety',
      'Implementation practicality'
    ],
    timeoutMinutes: 18
  },
  {
    id: 'quantum-education',
    title: 'Multi-Audience Quantum Explanation',
    category: 'Education & Communication',
    difficulty: 'medium',
    prompt: `Explain quantum entanglement to:

1. a 6-year-old
2. a teenager  
3. a graduate physics student
4. an engineer

Then merge all 4 explanations into a single unified teaching resource.`,
    description: 'Tests communication adaptation and synthesis capabilities',
    expectedOutcomes: [
      'Age-appropriate explanations for each audience',
      'Scientifically accurate content',
      'Unified teaching resource',
      'Progressive complexity structure',
      'Engaging presentation'
    ],
    evaluationCriteria: [
      'Scientific accuracy across levels',
      'Age-appropriate communication',
      'Synthesis quality',
      'Teaching effectiveness',
      'Engagement factor'
    ],
    timeoutMinutes: 10
  }
];

// Model configurations for testing
export const TEST_MODELS = [
  { id: 'collaborative', name: 'Collaborative Pipeline', type: 'multi-agent' },
  { id: 'gpt-4', name: 'GPT-4', type: 'individual' },
  { id: 'gemini-pro', name: 'Gemini Pro', type: 'individual' },
  { id: 'perplexity', name: 'Perplexity', type: 'individual' },
  { id: 'kimi', name: 'Kimi', type: 'individual' }
] as const;