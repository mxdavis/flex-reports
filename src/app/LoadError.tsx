import './LoadError.css'

type LoadErrorProps = {
  message: string
  onRetry: () => void
}

// Shown instead of the report when its data can't be loaded.
function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div className="fr-app-load-error" role="alert">
      <p>Couldn't load the report data. {message}</p>
      <button type="button" onClick={onRetry}>Try again</button>
    </div>
  )
}

export default LoadError
