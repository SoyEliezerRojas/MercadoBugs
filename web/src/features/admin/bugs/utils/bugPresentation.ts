import type { BugCategory, BugSeverity, BugStatus } from '../types'

const severityLabels: Record<BugSeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const categoryLabels: Record<BugCategory, string> = {
  business_rule: 'Regla de negocio',
  inventory: 'Inventario',
  concurrency: 'Concurrencia',
  calculation: 'Cálculo',
  filtering: 'Filtros',
}

const statusLabels: Record<BugStatus, string> = {
  planned: 'Planificado',
  enabled: 'Activo',
  disabled: 'Deshabilitado',
}

export function getBugSeverityLabel(severity: BugSeverity): string {
  return severityLabels[severity]
}

export function getBugCategoryLabel(category: BugCategory): string {
  return categoryLabels[category]
}

export function getBugStatusLabel(status: BugStatus): string {
  return statusLabels[status]
}
