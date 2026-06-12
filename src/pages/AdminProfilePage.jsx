import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import { changeMyPassword, getSession, saveSession, updateMyProfile } from '../lib/api'

function initials(name = 'User') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function AdminProfilePage() {
  const navigate = useNavigate()
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/login')
      return
    }

    setProfileForm({
      name: session.user.name || '',
      email: session.user.email || '',
      phone: session.user.profile?.phone || '',
      designation: session.user.profile?.designation || '',
      department: session.user.profile?.department || '',
    })
  }, [navigate])

  const updateProfileField = (key, value) => {
    setProfileForm((current) => ({ ...current, [key]: value }))
  }

  const updatePasswordField = (key, value) => {
    setPasswordForm((current) => ({ ...current, [key]: value }))
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const result = await updateMyProfile({
        name: profileForm.name,
        profile: {
          phone: profileForm.phone,
          designation: profileForm.designation,
          department: profileForm.department,
        },
      })
      const session = getSession()
      saveSession({ ...session, user: result.user })
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match')
      return
    }

    try {
      await changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSuccess('Password changed successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-account-page profile-page">
        <header className="admin-page-head">
          <div>
            <h1>Profile Settings</h1>
            <p>Update your account information and password.</p>
          </div>
        </header>

        <section className="profile-card">
          {error && <p className="page-error">{error}</p>}
          {success && <p className="page-success">{success}</p>}
          <h2>Personal Information</h2>
          <div className="profile-photo-row">
            <div className="profile-photo">{initials(profileForm.name)}</div>
            <div>
              <h3>Profile Photo</h3>
              <p>Identity initials are generated from your profile name.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="profile-fields two-col">
              <label>
                Full Name
                <input type="text" value={profileForm.name} onChange={(event) => updateProfileField('name', event.target.value)} />
              </label>
              <label>
                Email Address
                <input type="email" value={profileForm.email} readOnly />
              </label>
              <label>
                Phone
                <input type="text" value={profileForm.phone} onChange={(event) => updateProfileField('phone', event.target.value)} />
              </label>
              <label>
                Designation
                <input type="text" value={profileForm.designation} onChange={(event) => updateProfileField('designation', event.target.value)} />
              </label>
              <label>
                Department
                <input type="text" value={profileForm.department} onChange={(event) => updateProfileField('department', event.target.value)} />
              </label>
            </div>
            <button className="save-profile" type="submit">Save Profile</button>
          </form>

          <hr />

          <form onSubmit={handlePasswordSubmit}>
            <h2>Change Password</h2>
            <div className="profile-fields password-fields">
              <label>
                Current Password
                <span>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                  />
                  <Icon name="eye" size={18} />
                </span>
              </label>
              <label>
                New Password
                <span>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                  />
                  <Icon name="eye" size={18} />
                </span>
              </label>
              <label>
                Confirm Password
                <span>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                  />
                  <Icon name="eye" size={18} />
                </span>
              </label>
            </div>

            <button className="save-profile" type="submit">Change Password</button>
          </form>
        </section>
      </div>
    </AdminLayout>
  )
}

export default AdminProfilePage
