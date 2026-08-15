import { useState } from 'react'

interface ProductImageProps {
  alt: string
  className?: string
  eager?: boolean
  src: string | null
}

export function ProductImage({ alt, className = '', eager = false, src }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
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
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailedSrc(src)}
      src={src}
    />
  )
}
