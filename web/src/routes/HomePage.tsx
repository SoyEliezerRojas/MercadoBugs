import { Link } from 'react-router-dom'

const highlights = [
  {
    eyebrow: 'Catálogo variado',
    title: 'Tecnología para cada espacio',
    description: 'Explora productos de computación, audio, hogar y gaming.',
  },
  {
    eyebrow: 'Compra simulada',
    title: 'Un flujo completo y seguro',
    description: 'Practica desde la búsqueda hasta el seguimiento del pedido.',
  },
  {
    eyebrow: 'Pensado para QA',
    title: 'Pon a prueba tu atención',
    description: 'Registra tus hallazgos con reportes claros y reproducibles.',
  },
]

const categories = ['Celulares', 'Computación', 'Audio', 'Hogar', 'Gaming', 'Accesorios']

export function HomePage() {
  return (
    <>
      <section className="hero page-width">
        <div className="hero__content">
          <span className="eyebrow">Una tienda. Muchos escenarios.</span>
          <h1>Compra como usuario. <span>Piensa como tester.</span></h1>
          <p>
            Recorre una experiencia de e-commerce realista y entrena tu criterio de calidad de
            principio a fin.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" to="/products">
              Explorar catálogo
            </Link>
            <Link className="button button--secondary" to="/register">
              Comenzar práctica
            </Link>
          </div>
        </div>
        <div aria-label="Vista previa del marketplace" className="hero__visual">
          <div className="visual-card visual-card--featured">
            <span className="visual-card__tag">Destacado</span>
            <div className="visual-card__product" aria-hidden="true">⌁</div>
            <strong>Productos seleccionados</strong>
            <span>Descubre el catálogo de práctica</span>
          </div>
          <div className="visual-card visual-card--stat">
            <strong>30+</strong>
            <span>productos ficticios</span>
          </div>
        </div>
      </section>

      <section className="section page-width">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Categorías</span>
            <h2>Encuentra lo que buscas</h2>
          </div>
          <Link className="text-link" to="/products">Ver todo <span aria-hidden="true">→</span></Link>
        </div>
        <div className="category-list">
          {categories.map((category, index) => (
            <Link className="category-chip" key={category} to="/products">
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="section page-width">
        <div className="highlight-grid">
          {highlights.map((highlight) => (
            <article className="highlight-card" key={highlight.title}>
              <span className="eyebrow">{highlight.eyebrow}</span>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="training-notice page-width">
        <span aria-hidden="true" className="training-notice__icon">i</span>
        <p>
          <strong>Entorno de entrenamiento:</strong> MercadoBugs no es una tienda real. No ingreses
          datos personales, direcciones reales ni información de pago.
        </p>
      </aside>
    </>
  )
}
