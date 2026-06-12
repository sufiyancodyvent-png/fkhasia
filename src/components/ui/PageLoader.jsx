function PageLoader({ label = 'Loading workspace...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="loader-ring" aria-hidden="true" />
      <strong>{label}</strong>
    </div>
  )
}

export default PageLoader
