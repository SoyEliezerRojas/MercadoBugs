import { Link } from 'react-router-dom'
import type { BugDefinitionSummary } from '../types'
import { getBugCategoryLabel } from '../utils/bugPresentation'
import { BugDefinitionBadges } from './BugDefinitionBadges'

interface BugDefinitionCardProps {
  bug: BugDefinitionSummary
}

export function BugDefinitionCard({ bug }: BugDefinitionCardProps) {
  return (
    <article className="bug-card">
      <div className="bug-card__heading">
        <span>{bug.code}</span>
        <small>{getBugCategoryLabel(bug.category)}</small>
      </div>
      <h2>{bug.name}</h2>
      <BugDefinitionBadges severity={bug.severity} status={bug.status} />
      <Link aria-label={`Ver detalle de ${bug.code}`} className="text-link" to={`/admin/bugs/${bug.code}`}>
        Ver detalle <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}
