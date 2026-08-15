export type BugSeverity = 'low' | 'medium' | 'high' | 'critical'
export type BugCategory = 'business_rule' | 'inventory' | 'concurrency' | 'calculation' | 'filtering'
export type BugStatus = 'planned' | 'enabled' | 'disabled'

export interface BugDefinitionSummary {
  id: string
  code: string
  name: string
  severity: BugSeverity
  category: BugCategory
  status: BugStatus
}

export interface BugDefinition extends BugDefinitionSummary {
  description: string
  preconditions: string
  reproductionSteps: string
  expectedResult: string
  actualResult: string
  createdAt: string
  updatedAt: string
}
