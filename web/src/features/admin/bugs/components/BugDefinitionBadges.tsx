import type { BugSeverity, BugStatus } from '../types'
import { getBugSeverityLabel, getBugStatusLabel } from '../utils/bugPresentation'

interface BugDefinitionBadgesProps {
  severity: BugSeverity
  status: BugStatus
}

export function BugDefinitionBadges({ severity, status }: BugDefinitionBadgesProps) {
  return (
    <div className="bug-badges">
      <span className={`bug-badge bug-badge--severity-${severity}`}>
        Severidad: {getBugSeverityLabel(severity)}
      </span>
      <span className={`bug-badge bug-badge--status-${status}`}>
        Estado: {getBugStatusLabel(status)}
      </span>
    </div>
  )
}
