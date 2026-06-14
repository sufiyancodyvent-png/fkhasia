import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import {
  createUser,
  deleteUser,
  getDepartments,
  getSession,
  getUsers,
  updateUser,
} from '../lib/api'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  status: 'active',
  department: '',
  designation: '',
  phone: '',
  workMode: 'office',
  resumeUrl: '',
}

function initials(name = 'User') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function userId(user) {
  return user._id || user.id
}

function formFromEmployee(employee) {
  return {
    name: employee.name || '',
    email: employee.email || '',
    password: '',
    role: employee.role || 'employee',
    status: employee.status || 'active',
    department: employee.profile?.department || '',
    designation: employee.profile?.designation || '',
    phone: employee.profile?.phone || '',
    workMode: employee.profile?.workMode || 'office',
    resumeUrl: employee.profile?.resumeUrl || '',
  }
}

function EmployeeModal({ departments, editingEmployee, form, onChange, onClose, onSubmit, saving }) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <form className="admin-modal" onSubmit={onSubmit}>
        <header>
          <div>
            <h2>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
            <p>{editingEmployee ? 'Update employee details and access.' : 'Create a secure employee account.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close employee form">x</button>
        </header>

        <div className="admin-form-grid">
          <label>
            Full Name
            <input required value={form.name} onChange={(event) => onChange('name', event.target.value)} />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} />
          </label>
          <label>
            Password {editingEmployee && <small>leave empty to keep current</small>}
            <input
              required={!editingEmployee}
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => onChange('password', event.target.value)}
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => onChange('role', event.target.value)}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Department
            <select value={form.department} onChange={(event) => onChange('department', event.target.value)}>
              <option value="">No Department</option>
              {departments.map((department) => (
                <option value={department.name} key={department._id || department.name}>{department.name}</option>
              ))}
            </select>
          </label>
          <label>
            Designation
            <input value={form.designation} onChange={(event) => onChange('designation', event.target.value)} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => onChange('phone', event.target.value)} />
          </label>
          <label>
            Work Mode
            <select value={form.workMode} onChange={(event) => onChange('workMode', event.target.value)}>
              <option value="office">Office</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => onChange('status', event.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="admin-form-wide">
            CV / Resume URL
            <input
              type="url"
              placeholder="https://..."
              value={form.resumeUrl}
              onChange={(event) => onChange('resumeUrl', event.target.value)}
            />
          </label>
        </div>

        <footer>
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="green-action" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Employee'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function AdminEmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const session = getSession()
      if (!session) {
        navigate('/login')
        return
      }

      const [usersResult, departmentResult] = await Promise.all([getUsers(), getDepartments()])
      setEmployees(usersResult.users || [])
      setDepartments(departmentResult.departments || [])
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadData().catch((err) => setError(err.message))
  }, [loadData])

  const filteredEmployees = useMemo(() => {
    const search = query.trim().toLowerCase()

    return employees.filter((employee) => {
      const profile = employee.profile || {}
      const matchesSearch = !search
        || employee.name?.toLowerCase().includes(search)
        || employee.email?.toLowerCase().includes(search)
        || profile.designation?.toLowerCase().includes(search)
      const matchesDepartment = departmentFilter === 'all' || profile.department === departmentFilter
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [departmentFilter, employees, query, statusFilter])

  const openCreate = () => {
    setError('')
    setSuccess('')
    setEditingEmployee(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  const openEdit = (employee) => {
    setError('')
    setSuccess('')
    setEditingEmployee(employee)
    setForm(formFromEmployee(employee))
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEmployee(null)
    setForm(emptyForm)
  }

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const buildPayload = () => ({
    name: form.name.trim(),
    email: form.email.trim(),
    ...(form.password ? { password: form.password } : {}),
    role: form.role,
    status: form.status,
    profile: {
      department: form.department,
      designation: form.designation,
      phone: form.phone,
      workMode: form.workMode,
      resumeUrl: form.resumeUrl,
    },
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingEmployee) {
        await updateUser(userId(editingEmployee), buildPayload())
        setSuccess('User updated successfully.')
      } else {
        await createUser(buildPayload())
        setSuccess('User created successfully.')
      }
      closeModal()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (employee) => {
    if (!window.confirm(`Delete ${employee.name}? This action cannot be undone.`)) return

    try {
      setError('')
      setSuccess('')
      await deleteUser(userId(employee))
      setSuccess('User deleted successfully.')
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-account-page hr-page">
        <header className="admin-page-head">
          <div>
            <h1>Employee Directory</h1>
            <p>Manage team members, admin access, departments, and CV records.</p>
          </div>
          <button className="green-action" type="button" onClick={openCreate}>
            <Icon name="plus" size={18} />
            Add Employee
          </button>
        </header>

        <section className="hr-search-card employee-filters">
          <div className="member-search employee-search">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search name, email, or title..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="all">All Departments</option>
            {departments.map((department) => (
              <option value={department.name} key={department._id || department.name}>{department.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </section>

        <section className="hr-table-card employee-table">
          {error && <p className="page-error">{error}</p>}
          {success && <p className="page-success">{success}</p>}
          <div className="hr-table-row header">
            <span>Employee</span>
            <span>Role & Dept</span>
            <span>Contact</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {loading && !employees.length ? (
            <PageLoader label="Loading employees..." />
          ) : filteredEmployees.map((employee) => (
            <div className="hr-table-row" key={employee.email}>
              <div className="employee-name">
                <span>{initials(employee.name)}</span>
                <div>
                  <strong>{employee.name}</strong>
                  <small>{employee.email}</small>
                </div>
              </div>
              <div className="role-detail">
                <strong>{employee.profile?.designation || employee.role}</strong>
                <small>{employee.profile?.department || 'No Dept'} / {employee.role}</small>
              </div>
              <span>{employee.profile?.phone || '-'}</span>
              <span className="active-pill">{employee.status}</span>
              <div className="action-cell employee-actions">
                <button
                  type="button"
                  aria-label={`Open CV for ${employee.name}`}
                  disabled={!employee.profile?.resumeUrl}
                  onClick={() => employee.profile?.resumeUrl && window.open(employee.profile.resumeUrl, '_blank', 'noopener,noreferrer')}
                >
                  <Icon name="file" size={16} />
                </button>
                <button type="button" aria-label={`Edit ${employee.name}`} onClick={() => openEdit(employee)}>
                  <Icon name="pencil" size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${employee.name}`}
                  disabled={employee.role === 'admin'}
                  title={employee.role === 'admin' ? 'Admin accounts cannot be deleted from this page' : 'Delete user'}
                  onClick={() => handleDelete(employee)}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
          {!loading && !filteredEmployees.length && (
            <div className="hr-table-row">
              <span>No employees found.</span>
              <span>-</span>
              <span>-</span>
              <span>-</span>
              <span>-</span>
            </div>
          )}
        </section>

        {isModalOpen && (
          <EmployeeModal
            departments={departments}
            editingEmployee={editingEmployee}
            form={form}
            onChange={updateForm}
            onClose={closeModal}
            onSubmit={handleSubmit}
            saving={saving}
          />
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminEmployeesPage
