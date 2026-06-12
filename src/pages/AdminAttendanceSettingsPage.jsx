import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import { getAttendanceSettings, getSession, updateAttendanceSettings } from '../lib/api'
import { createTimeOptions } from '../lib/time'

const timeOptions = createTimeOptions(15)

function Toggle({ checked = false }) {
  return <span className={checked ? 'setting-toggle on' : 'setting-toggle'} aria-hidden="true" />
}

function AdminAttendanceSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const session = getSession()

        if (!session) {
          navigate('/login')
          return
        }

        setSettings((await getAttendanceSettings()).settings)
      } catch (err) {
        setError(err.message)
      }
    }

    load()
  }, [navigate])

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const saveSettings = async () => {
    try {
      setError('')
      setMessage('')
      const saved = await updateAttendanceSettings(settings)
      setSettings(saved.settings)
      setMessage('Settings saved successfully')
    } catch (err) {
      setError(err.message)
    }
  }

  const current = settings || {}

  return (
    <AdminLayout>
      <div className="admin-account-page attendance-page attendance-simple-page">
        <header className="admin-page-head">
          <div>
            <h1>Attendance Settings</h1>
            <p>Configure attendance rules and preferences</p>
          </div>
        </header>

        <section className="attendance-settings-card">
          {error && <p className="page-error">{error}</p>}
          {message && <p className="page-success">{message}</p>}
          <div className="setting-row">
            <div>
              <h2>Allow Manual Entry</h2>
              <p>Employees can manually add forgotten logs</p>
            </div>
            <button type="button" className="setting-toggle-button" onClick={() => updateField('allowManualEntry', !current.allowManualEntry)}>
              <Toggle checked={current.allowManualEntry} />
            </button>
          </div>

          <div className="setting-row">
            <div>
              <h2>Auto Approve Attendance</h2>
              <p>Automatically approve clock-in/out logs</p>
            </div>
            <button type="button" className="setting-toggle-button" onClick={() => updateField('autoApproveAttendance', !current.autoApproveAttendance)}>
              <Toggle checked={current.autoApproveAttendance} />
            </button>
          </div>

          <div className="setting-row">
            <div>
              <h2>Monthly Attendance Goal</h2>
              <p>Set Monthly Work Hours Goal For Employees</p>
            </div>
            <div className="setting-number">
              <input
                type="number"
                min="1"
                max="744"
                value={current.monthlyGoalHours || 160}
                onChange={(event) => updateField('monthlyGoalHours', Number(event.target.value))}
              />
              <strong>Hours</strong>
            </div>
          </div>

          <div className="setting-time-grid">
            <div className="setting-row compact">
              <div>
                <h2>Shift Start Time</h2>
                <p>Standard Shift Start Time</p>
              </div>
              <div className="time-pill">
                <select
                  value={current.shiftStart || '09:00'}
                  onChange={(event) => updateField('shiftStart', event.target.value)}
                >
                  {timeOptions.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
                <Icon name="clock" size={17} />
              </div>
            </div>
            <div className="setting-row compact">
              <div>
                <h2>Shift End Time</h2>
                <p>Standard Shift End Time</p>
              </div>
              <div className="time-pill">
                <select
                  value={current.shiftEnd || '18:00'}
                  onChange={(event) => updateField('shiftEnd', event.target.value)}
                >
                  {timeOptions.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
                <Icon name="clock" size={17} />
              </div>
            </div>
          </div>

          <button className="settings-save-btn" type="button" onClick={saveSettings} disabled={!settings}>
            <Icon name="file" size={20} />
            Save Settings
          </button>
        </section>
      </div>
    </AdminLayout>
  )
}

export default AdminAttendanceSettingsPage
