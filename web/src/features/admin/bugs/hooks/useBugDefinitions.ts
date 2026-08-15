import { useQuery } from '@tanstack/react-query'
import { getBugDefinition, getBugDefinitions } from '../api/bugDefinitionsApi'

export const bugDefinitionKeys = {
  all: ['admin', 'bug-definitions'] as const,
  list: () => [...bugDefinitionKeys.all, 'list'] as const,
  detail: (code: string) => [...bugDefinitionKeys.all, 'detail', code] as const,
}

export function useBugDefinitions() {
  return useQuery({
    queryKey: bugDefinitionKeys.list(),
    queryFn: getBugDefinitions,
    staleTime: 5 * 60_000,
  })
}

export function useBugDefinition(code: string) {
  return useQuery({
    queryKey: bugDefinitionKeys.detail(code.toUpperCase()),
    queryFn: () => getBugDefinition(code),
    enabled: Boolean(code),
    staleTime: 5 * 60_000,
  })
}
