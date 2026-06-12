export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' })
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const status = err.code === 11000 ? 409 : err.statusCode || 500
  const message = err.code === 11000
    ? 'A record with this value already exists'
    : status === 500 ? 'Something went wrong' : err.message

  res.status(status).json({ message })
}
