interface ClearCartDialogProps {
  isClearing: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ClearCartDialog({ isClearing, onCancel, onConfirm }: ClearCartDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <div aria-labelledby="clear-cart-title" aria-modal="true" className="confirm-dialog" role="dialog">
        <span aria-hidden="true" className="confirm-dialog__mark">?</span>
        <h2 id="clear-cart-title">¿Quieres vaciar el carrito?</h2>
        <p>Se eliminarán todos los productos. Esta acción no se puede deshacer.</p>
        <div className="confirm-dialog__actions">
          <button
            autoFocus
            className="button button--secondary"
            disabled={isClearing}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="button button--danger"
            disabled={isClearing}
            onClick={onConfirm}
            type="button"
          >
            {isClearing ? 'Vaciando…' : 'Vaciar carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}
