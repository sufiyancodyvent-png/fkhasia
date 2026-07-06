import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import { getSession, createSupportTicket } from '../lib/api'

const CATEGORY_DESCRIPTIONS = {
  'Bug': 'Report a technical issue or error you encountered',
  'Feature request': 'Suggest a new feature or improvement',
  'Sales enquiry': 'Questions about our services or pricing',
  'Setup Request': 'Help with initial configuration',
}

function CreateSupportTicketPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [showCategoryHelp, setShowCategoryHelp] = useState(false)

  useEffect(() => {
    const currentSession = getSession()
    if (!currentSession) {
      navigate('/login')
      return
    }

    setSession(currentSession)
    setLoading(false)
  }, [navigate])

  const categories = [
    { value: 'Bug', label: 'Bug' },
    { value: 'Feature request', label: 'Feature Request' },
    { value: 'Sales enquiry', label: 'Sales Enquiry' },
    { value: 'Setup Request', label: 'Setup Request' },
  ]

  const validateForm = () => {
    const errors = {}

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required'
    } else if (formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters'
    } else if (formData.subject.trim().length > 300) {
      errors.subject = 'Subject must be less than 300 characters'
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      const ticket = await createSupportTicket({
        subject: formData.subject.trim(),
        category: formData.category.trim(),
      })

      setSuccessMessage('Ticket created successfully!')
      
      // Reset form
      setFormData({
        subject: '',
        category: '',
      })

      // Redirect to support dashboard after 2 seconds
      setTimeout(() => {
        navigate('/admin/support-dashboard', {
          state: { ticketCreated: true, ticketId: ticket._id },
        })
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to create ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading..." />
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Bug': <i className="fa-solid fa-bug" style={{ color: '#ff5e7e' }}></i>,
      'Feature request': <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#2ec4b6' }}></i>,
      'Sales enquiry': <i className="fa-solid fa-briefcase" style={{ color: '#3498db' }}></i>,
      'Setup Request': <i className="fa-solid fa-gears" style={{ color: '#9b59b6' }}></i>,
    }
    return icons[category] || <i className="fa-solid fa-file-lines"></i>
  }

  return (
    <AdminLayout>
      <div className="support-dashboard-container" style={{
        minHeight: 'calc(100vh - 62px)',
        padding: '1.5rem 1rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '550px',
          display: 'flex',
          flexDirection: 'column',
        }}>
        {/* Header - Compact */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/admin/support-dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2ec4b6',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.75rem',
              padding: 0,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#1da699'}
            onMouseLeave={(e) => e.target.style.color = '#2ec4b6'}
          >
            <span>←</span> Back
          </button>
          <h1 style={{
            margin: '0 0 0.25rem 0',
            fontSize: '1.9rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.5px',
          }}>
            Create Support Ticket
          </h1>
          <p style={{
            margin: 0,
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.85rem',
          }}>
            Submit an issue and our team will assist you
          </p>
        </div>

        {/* Main Form Card */}
        <div style={{
          backgroundColor: 'rgba(22, 33, 62, 0.6)',
          border: '1px solid rgba(46, 196, 182, 0.15)',
          borderRadius: '14px',
          padding: '1.75rem',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.875rem 1rem',
              backgroundColor: 'rgba(231, 76, 60, 0.12)',
              border: '1px solid rgba(231, 76, 60, 0.4)',
              borderRadius: '8px',
              color: '#ff6b6b',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              animation: 'slideDown 0.3s ease',
            }}>
              <Icon name="alert" size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: '600' }}>Error</p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.875rem 1rem',
              backgroundColor: 'rgba(46, 204, 113, 0.12)',
              border: '1px solid rgba(46, 204, 113, 0.4)',
              borderRadius: '8px',
              color: '#51cf66',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              animation: 'slideDown 0.3s ease',
            }}>
              <Icon name="checkmark" size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: '600' }}>Success!</p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Subject Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}>
                Subject <span style={{ color: '#ff6b6b' }}>*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Describe the issue or request"
                disabled={submitting}
                maxLength={300}
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: validationErrors.subject
                    ? '1.5px solid #ff6b6b'
                    : '1.5px solid rgba(46, 196, 182, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: submitting ? 0.6 : 1,
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  if (!validationErrors.subject) {
                    e.target.style.borderColor = '#2ec4b6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(46, 196, 182, 0.1)'
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.07)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none'
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  if (!validationErrors.subject) {
                    e.target.style.borderColor = 'rgba(46, 196, 182, 0.25)'
                  }
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
              }}>
                {validationErrors.subject ? (
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: '#ff6b6b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}>
                    <Icon name="alert" size={12} />
                    {validationErrors.subject}
                  </p>
                ) : (
                  <div />
                )}
                <p style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '500',
                }}>
                  {formData.subject.length}/300
                </p>
              </div>
            </div>

            {/* Category Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}>
                Category <span style={{ color: '#ff6b6b' }}>*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Enter custom category (e.g. Bug, Feature Request, Billing)"
                disabled={submitting}
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: validationErrors.category
                    ? '1.5px solid #ff6b6b'
                    : '1.5px solid rgba(46, 196, 182, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: submitting ? 0.6 : 1,
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  if (!validationErrors.category) {
                    e.target.style.borderColor = '#2ec4b6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(46, 196, 182, 0.1)'
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.07)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none'
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  if (!validationErrors.category) {
                    e.target.style.borderColor = 'rgba(46, 196, 182, 0.25)'
                  }
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
              }}>
                {validationErrors.category ? (
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: '#ff6b6b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}>
                    <Icon name="alert" size={12} />
                    {validationErrors.category}
                  </p>
                ) : (
                  <div />
                )}
              </div>
            </div>

            {/* Buttons - Flex spacer */}
            <div style={{ flex: 1 }} />

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              marginTop: '1.5rem',
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
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.8rem 1.75rem',
                  background: submitting
                    ? 'rgba(46, 196, 182, 0.5)'
                    : 'linear-gradient(135deg, #2ec4b6 0%, #1da699 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: submitting ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: submitting ? 'none' : '0 4px 12px rgba(46, 196, 182, 0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 6px 16px rgba(46, 196, 182, 0.45)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(46, 196, 182, 0.35)'
                }}
              >
                {submitting ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '0.9rem' }}>
                      ⟳
                    </span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={16} />
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom spacing */}
        <div style={{ height: '1rem' }} />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          form {
            padding: 0;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default CreateSupportTicketPage
