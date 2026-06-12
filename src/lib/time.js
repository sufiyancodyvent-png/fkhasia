export function formatClockTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

export function formatTimeValue(value) {
  if (!value) return '-'

  const [hourText = '0', minuteText = '0'] = String(value).split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const date = new Date(2000, 0, 1, hour, minute)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatShiftRange(start = '09:00', end = '18:00') {
  return `${formatTimeValue(start)} - ${formatTimeValue(end)}`
}

export function createTimeOptions(stepMinutes = 15) {
  const options = []

  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    options.push({ value, label: formatTimeValue(value) })
  }

  return options
}
