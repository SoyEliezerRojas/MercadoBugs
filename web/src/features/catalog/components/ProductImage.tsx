import { useState } from 'react'

interface ProductImageProps {
  alt: string
  className?: string
  eager?: boolean
  src: string | null
}

function resolveImageUrl(src: string | null) {
  const normalizedSrc = src?.trim()

  if (!normalizedSrc) {
    return null
  }

  if (/^(?:https?:)?\/\//i.test(normalizedSrc) || /^(?:blob|data):/i.test(normalizedSrc)) {
    return normalizedSrc
  }

  return `${import.meta.env.BASE_URL}${normalizedSrc.replace(/^\/+/, '')}`
}

export function ProductImage({ alt, className = '', eager = false, src }: ProductImageProps) {
  const resolvedSrc = resolveImageUrl(src)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!resolvedSrc || failedSrc === resolvedSrc) {
    return (
      <div aria-label={`Imagen no disponible para ${alt}`} className={`product-image-fallback ${className}`} role="img">
        <span aria-hidden="true">MB</span>
        <small>Imagen no disponible</small>
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailedSrc(resolvedSrc)}
      src={resolvedSrc}
    />
  )
}
