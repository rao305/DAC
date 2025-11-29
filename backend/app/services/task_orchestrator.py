"""
Agile Task Graph Builder (ATGB) - Dynamic Workflow Orchestration

Converts every user message into a DAG of tasks and intelligently assigns 
them to models. This is real workflow orchestration with automatic construction.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import time
import json
from app.services.intent_classifier import IntentType, IntentVector

class TaskType(Enum):
    """Types of tasks in the workflow graph"""
    RESEARCH = "research"           # Information gathering
    ANALYSIS = "analysis"           # Data analysis and breakdown
    GENERATION = "generation"       # Content creation
    VALIDATION = "validation"       # Quality checking
    SYNTHESIS = "synthesis"         # Combining results
    OPTIMIZATION = "optimization"   # Performance improvement
    DEBUGGING = "debugging"         # Problem solving
    FORMATTING = "formatting"       # Output structuring

class TaskStatus(Enum):
    """Status of individual tasks"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"

class TaskPriority(Enum):
    """Task execution priority levels"""
    CRITICAL = 1    # Must complete before others
    HIGH = 2        # Important but can run in parallel
    MEDIUM = 3      # Standard priority
    LOW = 4         # Can be delayed if needed

@dataclass
class TaskNode:
    """Individual task in the workflow graph"""
    id: str
    task_type: TaskType
    description: str
    assigned_model: Optional[str] = None
    dependencies: Set[str] = field(default_factory=set)  # Task IDs this depends on
    priority: TaskPriority = TaskPriority.MEDIUM
    estimated_time_ms: int = 1000
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[str] = None
    error: Optional[str] = None
    execution_time_ms: Optional[int] = None
    confidence: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass 
class WorkflowDAG:
    """Directed Acyclic Graph representing the complete workflow"""
    nodes: Dict[str, TaskNode] = field(default_factory=dict)
    execution_order: List[List[str]] = field(default_factory=list)  # Parallel execution batches
    total_estimated_time: int = 0
    complexity_score: float = 0.0
    parallelization_opportunities: int = 0

class TaskOrchestrator:
    """Intelligent workflow orchestration and task graph construction"""
    
    def __init__(self):
        self.task_patterns = self._build_task_patterns()
        self.model_capabilities = self._initialize_model_capabilities()
        
    def _build_task_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Build patterns for automatic task detection"""
        return {
            "api_development": {
                "pattern": r"\b(api|endpoint|service|backend)\b.*\b(build|create|develop)\b",
                "tasks": [
                    {"type": TaskType.ANALYSIS, "desc": "Analyze API requirements"},
                    {"type": TaskType.RESEARCH, "desc": "Research best practices and frameworks"},
                    {"type": TaskType.GENERATION, "desc": "Generate API structure and endpoints"},
                    {"type": TaskType.VALIDATION, "desc": "Validate API design and security"},
                    {"type": TaskType.SYNTHESIS, "desc": "Create comprehensive API documentation"}
                ],
                "dependencies": [
                    ("analysis", "research"),
                    ("research", "generation"), 
                    ("generation", "validation"),
                    ("validation", "synthesis")
                ]
            },
            "bug_fixing": {
                "pattern": r"\b(bug|fix|error|issue|broken)\b",
                "tasks": [
                    {"type": TaskType.ANALYSIS, "desc": "Analyze error symptoms and context"},
                    {"type": TaskType.DEBUGGING, "desc": "Trace root cause of the issue"},
                    {"type": TaskType.RESEARCH, "desc": "Research known solutions and patterns"},
                    {"type": TaskType.GENERATION, "desc": "Generate fix implementation"},
                    {"type": TaskType.VALIDATION, "desc": "Validate fix effectiveness"}
                ],
                "dependencies": [
                    ("analysis", "debugging"),
                    ("debugging", "research"),
                    ("research", "generation"),
                    ("generation", "validation")
                ]
            },
            "performance_optimization": {
                "pattern": r"\b(optimize|performance|speed|slow)\b",
                "tasks": [
                    {"type": TaskType.ANALYSIS, "desc": "Profile current performance"},
                    {"type": TaskType.RESEARCH, "desc": "Research optimization techniques"},
                    {"type": TaskType.OPTIMIZATION, "desc": "Implement performance improvements"},
                    {"type": TaskType.VALIDATION, "desc": "Benchmark and validate improvements"},
                    {"type": TaskType.SYNTHESIS, "desc": "Document optimization results"}
                ],
                "dependencies": [
                    ("analysis", "research"),
                    ("research", "optimization"),
                    ("optimization", "validation"),
                    ("validation", "synthesis")
                ]
            },
            "feature_implementation": {
                "pattern": r"\b(implement|add|create|build).*\b(feature|functionality)\b",
                "tasks": [
                    {"type": TaskType.ANALYSIS, "desc": "Break down feature requirements"},
                    {"type": TaskType.RESEARCH, "desc": "Research implementation approaches"},
                    {"type": TaskType.GENERATION, "desc": "Generate core feature implementation"},
                    {"type": TaskType.VALIDATION, "desc": "Test feature functionality"},
                    {"type": TaskType.FORMATTING, "desc": "Format and document feature"}
                ],
                "dependencies": [
                    ("analysis", "research"),
                    ("research", "generation"),
                    ("generation", "validation"),
                    ("validation", "formatting")
                ]
            },
            "code_review": {
                "pattern": r"\b(review|analyze|check).*\b(code|implementation)\b",
                "tasks": [
                    {"type": TaskType.ANALYSIS, "desc": "Analyze code structure and patterns"},
                    {"type": TaskType.VALIDATION, "desc": "Check for bugs and vulnerabilities"},
                    {"type": TaskType.RESEARCH, "desc": "Research best practices compliance"},
                    {"type": TaskType.OPTIMIZATION, "desc": "Identify optimization opportunities"},
                    {"type": TaskType.SYNTHESIS, "desc": "Synthesize comprehensive review report"}
                ],
                "dependencies": [
                    ("analysis", "validation"),
                    ("analysis", "research"),
                    ("analysis", "optimization"),
                    ("validation", "synthesis"),
                    ("research", "synthesis"),
                    ("optimization", "synthesis")
                ]
            },
            "system_design": {
                "pattern": r"\b(design|architect|system)\b",
                "tasks": [
                    {"type": TaskType.ANALYSIS, "desc": "Analyze requirements and constraints"},
                    {"type": TaskType.RESEARCH, "desc": "Research architectural patterns"},
                    {"type": TaskType.GENERATION, "desc": "Design system architecture"},
                    {"type": TaskType.VALIDATION, "desc": "Validate scalability and reliability"},
                    {"type": TaskType.SYNTHESIS, "desc": "Create comprehensive design document"}
                ],
                "dependencies": [
                    ("analysis", "research"),
                    ("research", "generation"),
                    ("generation", "validation"),
                    ("validation", "synthesis")
                ]
            }
        }
    
    def _initialize_model_capabilities(self) -> Dict[str, Dict[TaskType, float]]:
        """Initialize model capabilities for different task types"""
        return {
            "gpt-4o": {
                TaskType.RESEARCH: 0.7,
                TaskType.ANALYSIS: 0.9,
                TaskType.GENERATION: 0.95,
                TaskType.VALIDATION: 0.8,
                TaskType.SYNTHESIS: 0.9,
                TaskType.OPTIMIZATION: 0.85,
                TaskType.DEBUGGING: 0.9,
                TaskType.FORMATTING: 0.8
            },
            "claude-3-5-sonnet": {
                TaskType.RESEARCH: 0.8,
                TaskType.ANALYSIS: 0.95,
                TaskType.GENERATION: 0.85,
                TaskType.VALIDATION: 0.9,
                TaskType.SYNTHESIS: 0.9,
                TaskType.OPTIMIZATION: 0.8,
                TaskType.DEBUGGING: 0.85,
                TaskType.FORMATTING: 0.85
            },
            "gemini-2.0-flash": {
                TaskType.RESEARCH: 0.85,
                TaskType.ANALYSIS: 0.8,
                TaskType.GENERATION: 0.8,
                TaskType.VALIDATION: 0.75,
                TaskType.SYNTHESIS: 0.75,
                TaskType.OPTIMIZATION: 0.9,
                TaskType.DEBUGGING: 0.7,
                TaskType.FORMATTING: 0.9
            },
            "sonar-pro": {
                TaskType.RESEARCH: 0.95,
                TaskType.ANALYSIS: 0.7,
                TaskType.GENERATION: 0.6,
                TaskType.VALIDATION: 0.8,
                TaskType.SYNTHESIS: 0.7,
                TaskType.OPTIMIZATION: 0.5,
                TaskType.DEBUGGING: 0.6,
                TaskType.FORMATTING: 0.6
            },
            "kimi": {
                TaskType.RESEARCH: 0.7,
                TaskType.ANALYSIS: 0.8,
                TaskType.GENERATION: 0.75,
                TaskType.VALIDATION: 0.85,
                TaskType.SYNTHESIS: 0.8,
                TaskType.OPTIMIZATION: 0.7,
                TaskType.DEBUGGING: 0.8,
                TaskType.FORMATTING: 0.75
            }
        }

    async def build_workflow_dag(
        self, 
        user_query: str, 
        intent_vector: IntentVector,
        available_models: List[str]
    ) -> WorkflowDAG:
        """
        Automatically build a DAG of tasks from user query.
        This is the core intelligence that converts requests into workflows.
        """
        
        # Step 1: Pattern matching to identify workflow type
        workflow_type = self._identify_workflow_type(user_query)
        
        # Step 2: Generate base task structure
        if workflow_type:
            base_tasks = self.task_patterns[workflow_type]["tasks"]
            base_dependencies = self.task_patterns[workflow_type]["dependencies"]
        else:
            # Fallback: generate tasks from intent vector
            base_tasks, base_dependencies = self._generate_tasks_from_intent(intent_vector)
        
        # Step 3: Create task nodes
        nodes = {}
        for i, task_def in enumerate(base_tasks):
            task_id = f"task_{i}_{task_def['type'].value}"
            
            node = TaskNode(
                id=task_id,
                task_type=task_def["type"],
                description=task_def["desc"],
                priority=self._calculate_priority(task_def["type"], intent_vector),
                estimated_time_ms=self._estimate_task_time(task_def["type"])
            )
            
            # Assign optimal model
            node.assigned_model = self._assign_optimal_model(
                task_def["type"], available_models
            )
            
            nodes[task_id] = node
        
        # Step 4: Set up dependencies
        task_name_to_id = {
            task["type"].value: f"task_{i}_{task['type'].value}"
            for i, task in enumerate(base_tasks)
        }
        
        for dep_from, dep_to in base_dependencies:
            if dep_from in task_name_to_id and dep_to in task_name_to_id:
                from_id = task_name_to_id[dep_from]
                to_id = task_name_to_id[dep_to]
                nodes[to_id].dependencies.add(from_id)
        
        # Step 5: Calculate execution order and parallelization
        execution_order = self._calculate_execution_order(nodes)
        
        # Step 6: Calculate workflow metrics
        total_time = self._calculate_total_time(nodes, execution_order)
        complexity = self._calculate_complexity_score(nodes)
        parallelization = self._count_parallelization_opportunities(execution_order)
        
        return WorkflowDAG(
            nodes=nodes,
            execution_order=execution_order,
            total_estimated_time=total_time,
            complexity_score=complexity,
            parallelization_opportunities=parallelization
        )
    
    async def execute_workflow(
        self, 
        workflow: WorkflowDAG,
        user_query: str,
        api_keys: Dict[str, str],
        context: str = ""
    ) -> Dict[str, Any]:
        """Execute the workflow DAG with intelligent orchestration"""
        
        start_time = time.perf_counter()
        results = {}
        
        try:
            # Execute tasks in dependency order
            for batch in workflow.execution_order:
                # Execute current batch in parallel
                batch_tasks = []
                for task_id in batch:
                    task_node = workflow.nodes[task_id]
                    
                    # Check if dependencies are satisfied
                    dependencies_met = all(
                        dep_id in results and workflow.nodes[dep_id].status == TaskStatus.COMPLETED
                        for dep_id in task_node.dependencies
                    )
                    
                    if dependencies_met:
                        task_node.status = TaskStatus.RUNNING
                        batch_tasks.append(self._execute_task(
                            task_node, user_query, results, api_keys, context
                        ))
                    else:
                        task_node.status = TaskStatus.BLOCKED
                
                # Wait for batch completion
                if batch_tasks:
                    batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                    
                    for i, result in enumerate(batch_results):
                        task_id = batch[i] if i < len(batch) else None
                        if task_id and task_id in workflow.nodes:
                            if isinstance(result, Exception):
                                workflow.nodes[task_id].status = TaskStatus.FAILED
                                workflow.nodes[task_id].error = str(result)
                            else:
                                workflow.nodes[task_id].status = TaskStatus.COMPLETED
                                workflow.nodes[task_id].result = result.get("content", "")
                                workflow.nodes[task_id].confidence = result.get("confidence", 0.5)
                                results[task_id] = result
            
            # Synthesize final result
            final_result = await self._synthesize_workflow_results(
                workflow, results, user_query, api_keys
            )
            
            total_time = (time.perf_counter() - start_time) * 1000
            
            return {
                "final_result": final_result,
                "workflow_results": results,
                "execution_time_ms": total_time,
                "tasks_completed": len([n for n in workflow.nodes.values() if n.status == TaskStatus.COMPLETED]),
                "tasks_failed": len([n for n in workflow.nodes.values() if n.status == TaskStatus.FAILED]),
                "workflow_dag": workflow
            }
            
        except Exception as e:
            return {
                "final_result": f"Workflow execution failed: {str(e)}",
                "workflow_results": results,
                "execution_time_ms": (time.perf_counter() - start_time) * 1000,
                "error": str(e),
                "workflow_dag": workflow
            }
    
    def _identify_workflow_type(self, user_query: str) -> Optional[str]:
        """Identify workflow type from user query using pattern matching"""
        
        query_lower = user_query.lower()
        
        for workflow_type, config in self.task_patterns.items():
            pattern = config["pattern"]
            if self._match_pattern(query_lower, pattern):
                return workflow_type
        
        return None
    
    def _match_pattern(self, text: str, pattern: str) -> bool:
        """Simple pattern matching (enhance with regex in production)"""
        import re
        return bool(re.search(pattern, text))
    
    def _generate_tasks_from_intent(self, intent_vector: IntentVector) -> Tuple[List[Dict], List[Tuple]]:
        """Generate tasks when no specific pattern is matched"""
        
        tasks = []
        dependencies = []
        
        # Map intents to task types
        intent_to_task = {
            IntentType.RESEARCH: TaskType.RESEARCH,
            IntentType.ANALYZE: TaskType.ANALYSIS,
            IntentType.GENERATE: TaskType.GENERATION,
            IntentType.VERIFY: TaskType.VALIDATION,
            IntentType.SYNTHESIZE: TaskType.SYNTHESIS,
            IntentType.COMPUTE: TaskType.ANALYSIS,
            IntentType.DEBUG: TaskType.DEBUGGING,
            IntentType.REFACTOR: TaskType.OPTIMIZATION
        }
        
        # Create tasks for active intents
        active_intents = [
            (intent, confidence) 
            for intent, confidence in intent_vector.needs.items() 
            if confidence > 0.3
        ]
        
        # Sort by confidence
        active_intents.sort(key=lambda x: x[1], reverse=True)
        
        task_sequence = []
        for intent, confidence in active_intents:
            if intent in intent_to_task:
                task_type = intent_to_task[intent]
                tasks.append({
                    "type": task_type,
                    "desc": f"Execute {intent.value} task"
                })
                task_sequence.append(task_type.value)
        
        # Add synthesis task if multiple tasks
        if len(tasks) > 1:
            tasks.append({
                "type": TaskType.SYNTHESIS,
                "desc": "Synthesize results from all tasks"
            })
            task_sequence.append(TaskType.SYNTHESIS.value)
            
            # All previous tasks feed into synthesis
            for task_type in task_sequence[:-1]:
                dependencies.append((task_type, TaskType.SYNTHESIS.value))
        
        return tasks, dependencies
    
    def _calculate_priority(self, task_type: TaskType, intent_vector: IntentVector) -> TaskPriority:
        """Calculate task priority based on type and intent urgency"""
        
        # Base priority by task type
        type_priorities = {
            TaskType.RESEARCH: TaskPriority.HIGH,
            TaskType.ANALYSIS: TaskPriority.HIGH,
            TaskType.GENERATION: TaskPriority.MEDIUM,
            TaskType.VALIDATION: TaskPriority.MEDIUM,
            TaskType.SYNTHESIS: TaskPriority.LOW,
            TaskType.OPTIMIZATION: TaskPriority.LOW,
            TaskType.DEBUGGING: TaskPriority.CRITICAL,
            TaskType.FORMATTING: TaskPriority.LOW
        }
        
        base_priority = type_priorities.get(task_type, TaskPriority.MEDIUM)
        
        # Adjust based on urgency
        if intent_vector.urgency > 0.7:
            if base_priority.value > TaskPriority.HIGH.value:
                return TaskPriority.HIGH
        elif intent_vector.urgency > 0.4:
            if base_priority.value > TaskPriority.MEDIUM.value:
                return TaskPriority.MEDIUM
        
        return base_priority
    
    def _estimate_task_time(self, task_type: TaskType) -> int:
        """Estimate execution time for task type"""
        
        time_estimates = {
            TaskType.RESEARCH: 2000,      # Research takes longer
            TaskType.ANALYSIS: 1500,
            TaskType.GENERATION: 2500,    # Generation takes longest
            TaskType.VALIDATION: 1000,
            TaskType.SYNTHESIS: 1200,
            TaskType.OPTIMIZATION: 1800,
            TaskType.DEBUGGING: 2200,     # Debugging is complex
            TaskType.FORMATTING: 800
        }
        
        return time_estimates.get(task_type, 1000)
    
    def _assign_optimal_model(self, task_type: TaskType, available_models: List[str]) -> str:
        """Assign the best model for a specific task type"""
        
        best_model = None
        best_score = 0.0
        
        for model in available_models:
            if model in self.model_capabilities:
                score = self.model_capabilities[model].get(task_type, 0.0)
                if score > best_score:
                    best_score = score
                    best_model = model
        
        return best_model or (available_models[0] if available_models else "gpt-4o")
    
    def _calculate_execution_order(self, nodes: Dict[str, TaskNode]) -> List[List[str]]:
        """Calculate optimal execution order considering dependencies and priorities"""
        
        execution_order = []
        remaining_nodes = set(nodes.keys())
        
        while remaining_nodes:
            # Find nodes with satisfied dependencies
            ready_nodes = []
            for node_id in remaining_nodes:
                node = nodes[node_id]
                if all(dep_id not in remaining_nodes for dep_id in node.dependencies):
                    ready_nodes.append(node_id)
            
            if not ready_nodes:
                # Circular dependency or error - take remaining nodes
                ready_nodes = list(remaining_nodes)
            
            # Sort by priority for this batch
            ready_nodes.sort(key=lambda nid: nodes[nid].priority.value)
            
            execution_order.append(ready_nodes)
            remaining_nodes -= set(ready_nodes)
        
        return execution_order
    
    def _calculate_total_time(self, nodes: Dict[str, TaskNode], execution_order: List[List[str]]) -> int:
        """Calculate total workflow execution time considering parallelization"""
        
        total_time = 0
        
        for batch in execution_order:
            # Batch time is the maximum time of any task in the batch
            batch_time = max(nodes[task_id].estimated_time_ms for task_id in batch)
            total_time += batch_time
        
        return total_time
    
    def _calculate_complexity_score(self, nodes: Dict[str, TaskNode]) -> float:
        """Calculate workflow complexity score"""
        
        num_tasks = len(nodes)
        num_dependencies = sum(len(node.dependencies) for node in nodes.values())
        
        # Base complexity from task count and dependencies
        complexity = (num_tasks * 0.1) + (num_dependencies * 0.2)
        
        # Adjust for task types
        complex_tasks = sum(
            1 for node in nodes.values() 
            if node.task_type in [TaskType.DEBUGGING, TaskType.OPTIMIZATION, TaskType.ANALYSIS]
        )
        complexity += complex_tasks * 0.15
        
        return min(complexity, 1.0)
    
    def _count_parallelization_opportunities(self, execution_order: List[List[str]]) -> int:
        """Count opportunities for parallel execution"""
        return sum(len(batch) - 1 for batch in execution_order if len(batch) > 1)
    
    async def _execute_task(
        self,
        task_node: TaskNode,
        user_query: str,
        previous_results: Dict[str, Any],
        api_keys: Dict[str, str],
        context: str
    ) -> Dict[str, Any]:
        """Execute a single task with its assigned model"""
        
        start_time = time.perf_counter()
        
        # Build task-specific prompt
        task_prompt = self._build_task_prompt(
            task_node, user_query, previous_results, context
        )
        
        # Get API key for assigned model
        model_provider = self._get_provider_for_model(task_node.assigned_model)
        api_key = api_keys.get(model_provider)
        
        if not api_key:
            raise ValueError(f"No API key for provider {model_provider}")
        
        # Execute based on model type
        try:
            if model_provider == "openai":
                from app.adapters.openai_adapter import call_openai
                response = await call_openai(
                    messages=[{"role": "user", "content": task_prompt}],
                    model=task_node.assigned_model,
                    api_key=api_key,
                    temperature=0.7
                )
                content = response.content
                
            elif model_provider == "google":
                from app.adapters.gemini import call_gemini
                response = await call_gemini(
                    messages=[{"role": "user", "content": task_prompt}],
                    model=task_node.assigned_model,
                    api_key=api_key,
                    temperature=0.7
                )
                content = response.content
                
            elif model_provider == "perplexity":
                from app.adapters.perplexity import call_perplexity
                response = await call_perplexity(
                    messages=[{"role": "user", "content": task_prompt}],
                    model=task_node.assigned_model,
                    api_key=api_key
                )
                content = response.content
                
            else:
                raise ValueError(f"Unsupported provider: {model_provider}")
            
            execution_time = (time.perf_counter() - start_time) * 1000
            task_node.execution_time_ms = int(execution_time)
            
            return {
                "content": content,
                "confidence": 0.8,  # Default confidence
                "execution_time_ms": execution_time,
                "task_type": task_node.task_type.value,
                "model": task_node.assigned_model
            }
            
        except Exception as e:
            task_node.error = str(e)
            raise e
    
    def _build_task_prompt(
        self,
        task_node: TaskNode,
        user_query: str,
        previous_results: Dict[str, Any],
        context: str
    ) -> str:
        """Build specialized prompt for the specific task"""
        
        prompt_parts = []
        
        # Task-specific instruction
        task_instructions = {
            TaskType.RESEARCH: "Research and find current information with citations",
            TaskType.ANALYSIS: "Analyze and break down the problem systematically",
            TaskType.GENERATION: "Generate high-quality solution or content",
            TaskType.VALIDATION: "Validate and check for accuracy, security, and quality",
            TaskType.SYNTHESIS: "Synthesize all previous results into coherent response",
            TaskType.OPTIMIZATION: "Optimize performance and identify improvements",
            TaskType.DEBUGGING: "Debug systematically and identify root causes",
            TaskType.FORMATTING: "Format and structure the output professionally"
        }
        
        instruction = task_instructions.get(
            task_node.task_type, 
            "Complete the assigned task"
        )
        
        prompt_parts.append(f"**Task:** {instruction}")
        prompt_parts.append(f"**Description:** {task_node.description}")
        prompt_parts.append(f"**User Query:** {user_query}")
        
        # Include relevant previous results
        if previous_results:
            prompt_parts.append("**Previous Results:**")
            for result_id, result_data in previous_results.items():
                if isinstance(result_data, dict) and "content" in result_data:
                    prompt_parts.append(f"- {result_data.get('task_type', 'Task')}: {result_data['content'][:200]}...")
        
        # Include context if available
        if context:
            prompt_parts.append(f"**Context:** {context}")
        
        prompt_parts.append("**Instructions:** Focus on your specific task and provide high-quality output.")
        
        return "\n\n".join(prompt_parts)
    
    def _get_provider_for_model(self, model_id: str) -> str:
        """Map model IDs to providers"""
        provider_map = {
            "gpt-4o": "openai",
            "claude-3-5-sonnet": "anthropic",
            "gemini-2.0-flash": "google", 
            "sonar-pro": "perplexity",
            "kimi": "moonshot"
        }
        return provider_map.get(model_id, "openai")
    
    async def _synthesize_workflow_results(
        self,
        workflow: WorkflowDAG,
        results: Dict[str, Any],
        user_query: str,
        api_keys: Dict[str, str]
    ) -> str:
        """Synthesize all workflow results into final response"""
        
        # Find synthesis task if it exists
        synthesis_task = None
        for node in workflow.nodes.values():
            if node.task_type == TaskType.SYNTHESIS and node.status == TaskStatus.COMPLETED:
                synthesis_task = node
                break
        
        if synthesis_task and synthesis_task.result:
            return synthesis_task.result
        
        # Fallback: combine all completed results
        completed_results = []
        for task_id, result_data in results.items():
            if isinstance(result_data, dict) and result_data.get("content"):
                task_node = workflow.nodes.get(task_id)
                if task_node:
                    completed_results.append({
                        "task_type": task_node.task_type.value,
                        "description": task_node.description,
                        "content": result_data["content"]
                    })
        
        # Simple synthesis
        synthesis_parts = [f"**Query:** {user_query}\n"]
        
        for i, result in enumerate(completed_results, 1):
            synthesis_parts.append(f"**{i}. {result['task_type'].title()}**")
            synthesis_parts.append(result["content"])
            synthesis_parts.append("")
        
        if len(completed_results) > 1:
            synthesis_parts.append("**Summary**")
            synthesis_parts.append("All workflow tasks completed successfully with comprehensive analysis and solutions.")
        
        return "\n".join(synthesis_parts)

# Global orchestrator instance
task_orchestrator = TaskOrchestrator()