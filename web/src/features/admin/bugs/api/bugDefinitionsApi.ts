import { supabase } from '../../../../lib/supabase'
import type {
  BugCategory,
  BugDefinition,
  BugDefinitionSummary,
  BugSeverity,
  BugStatus,
} from '../types'

interface BugSummaryRow {
  id: unknown
  code: unknown
  name: unknown
  severity: unknown
  category: unknown
  status: unknown
}

interface BugDefinitionRow extends BugSummaryRow {
  description: unknown
  preconditions: unknown
  reproduction_steps: unknown
  expected_result: unknown
  actual_result: unknown
  created_at: unknown
  updated_at: unknown
}

const BUG_CODE_PATTERN = /^BUG-[0-9]{3}$/

function readString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`La definición contiene un valor inválido en ${field}.`)
  }

  return value
}

function readSeverity(value: unknown): BugSeverity {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') return value
  throw new Error('La definición contiene una severidad desconocida.')
}

function readCategory(value: unknown): BugCategory {
  if (
    value === 'business_rule'
    || value === 'inventory'
    || value === 'concurrency'
    || value === 'calculation'
    || value === 'filtering'
  ) return value

  throw new Error('La definición contiene una categoría desconocida.')
}

function readStatus(value: unknown): BugStatus {
  if (value === 'planned' || value === 'enabled' || value === 'disabled') return value
  throw new Error('La definición contiene un estado desconocido.')
}

function mapSummary(row: BugSummaryRow): BugDefinitionSummary {
  return {
    id: readString(row.id, 'id'),
    code: readString(row.code, 'código'),
    name: readString(row.name, 'nombre'),
    severity: readSeverity(row.severity),
    category: readCategory(row.category),
    status: readStatus(row.status),
  }
}

function mapDefinition(row: BugDefinitionRow): BugDefinition {
  return {
    ...mapSummary(row),
    description: readString(row.description, 'descripción'),
    preconditions: readString(row.preconditions, 'precondiciones'),
    reproductionSteps: readString(row.reproduction_steps, 'pasos'),
    expectedResult: readString(row.expected_result, 'resultado esperado'),
    actualResult: readString(row.actual_result, 'resultado actual'),
    createdAt: readString(row.created_at, 'fecha de creación'),
    updatedAt: readString(row.updated_at, 'fecha de actualización'),
  }
}

export async function getBugDefinitions(): Promise<BugDefinitionSummary[]> {
  const { data, error } = await supabase
    .from('bug_definitions')
    .select('id, code, name, severity, category, status')
    .order('code', { ascending: true })

  if (error) {
    throw new Error(`No se pudo cargar el catálogo de bugs: ${error.message}`)
  }

  return (data as unknown as BugSummaryRow[]).map(mapSummary)
}

export async function getBugDefinition(code: string): Promise<BugDefinition | null> {
  const normalizedCode = code.trim().toUpperCase()
  if (!BUG_CODE_PATTERN.test(normalizedCode)) return null

  const { data, error } = await supabase
    .from('bug_definitions')
    .select(`
      id,
      code,
      name,
      description,
      preconditions,
      reproduction_steps,
      expected_result,
      actual_result,
      severity,
      category,
      status,
      created_at,
      updated_at
    `)
    .eq('code', normalizedCode)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo cargar la definición del bug: ${error.message}`)
  }

  return data ? mapDefinition(data) : null
}
