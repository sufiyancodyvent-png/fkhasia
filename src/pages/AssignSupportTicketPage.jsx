import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageLoader from '../components/ui/PageLoader'
import { getSession, getSupportTicket, assignSupportTicket, getUsers } from '../lib/api'

function AssignSupportTicketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const currentSession = getSession()
    if (!currentSession) {
      navigate('/login')
      return
    }

    if (!['admin', 'manager'].includes(currentSession.user.role)) {
      navigate('/employee/dashboard')
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        // Fetch ticket details
        const ticketData = await getSupportTicket(id)
        setTicket(ticketData)
        if (ticketData.assignedTo) {
          setSelectedAgent(ticketData.assignedTo._id || ticketData.assignedTo)
        }

        // Fetch support agents
        const usersData = await getUsers()
        const supportAgents = usersData.users.filter(user => user.role === 'employee')
        setAgents(supportAgents)
      } catch (err) {
        setError(err.message || 'Failed to load ticket information')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!selectedAgent) {
      setError('Please select an agent')
      return
    }

    try {
      setSubmitting(true)
      await assignSupportTicket(id, selectedAgent)
      setSuccessMessage('Ticket assigned successfully!')
      
      setTimeout(() => {
        navigate('/admin/support-dashboard')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to assign ticket')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading ticket assignment..." />
  }

  return (
    <div className="support-dashboard-container" style={{
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      padding: '24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#071c24',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '550px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginRight: '0.8rem', flexShrink: 0 }}>
              <path d="M5 6l9 10-9 10h6l9-10-9-10H5z" fill="#ffffff" />
              <path d="M13 6l9 10-9 10h6l9-10-9-10h-6z" fill="#00adb5" />
            </svg>
            Assign Support Ticket
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            Allocate ticket to an active support agent
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#0c2b36',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        }}>
          {error && (
            <p style={{
              margin: '0 0 1.5rem 0',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255, 94, 126, 0.15)',
              border: '1px solid rgba(255, 94, 126, 0.3)',
              borderRadius: '6px',
              color: '#ff5e7e',
              fontSize: '0.85rem',
            }}>
              {error}
            </p>
          )}

          {successMessage && (
            <p style={{
              margin: '0 0 1.5rem 0',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(46, 204, 113, 0.15)',
              border: '1px solid rgba(46, 204, 113, 0.3)',
              borderRadius: '6px',
              color: '#2ecc71',
              fontSize: '0.85rem',
            }}>
              {successMessage}
            </p>
          )}

          {/* Ticket Subject Box */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}>
              Ticket Subject
            </label>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.95rem',
              lineHeight: '1.4',
            }}>
              {ticket?.subject}
            </div>
          </div>

          {/* Select Agent Dropdown */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}>
              Select Support Agent <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.9rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1.5px solid rgba(46, 196, 182, 0.25)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="" style={{ backgroundColor: '#071c24' }}>-- Select an agent --</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id} style={{ backgroundColor: '#071c24' }}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <button
              type="button"
              onClick={() => navigate('/admin/support-dashboard')}
              disabled={submitting}
              style={{
                padding: '0.8rem 1.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedAgent}
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#2ec4b6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting || !selectedAgent ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'background-color 0.2s',
                opacity: submitting || !selectedAgent ? 0.6 : 1,
              }}
            >
              {submitting ? 'Assigning...' : 'Assign Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssignSupportTicketPage
