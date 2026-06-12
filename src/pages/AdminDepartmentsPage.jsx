import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/dashboard/AdminLayout'
import Icon from '../components/icons/Icon'
import PageLoader from '../components/ui/PageLoader'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  getSession,
  updateDepartment,
} from '../lib/api'

const emptyForm = {
  name: '',
  description: '',
  status: 'active',
}

function DepartmentModal({ editingDepartment, form, onChange, onClose, onSubmit, saving }) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <form className="admin-modal compact" onSubmit={onSubmit}>
        <header>
          <div>
            <h2>{editingDepartment ? 'Edit Department' : 'New Department'}</h2>
            <p>Keep company structure clean and searchable.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close department form">x</button>
        </header>

        <div className="admin-form-grid single">
          <label>
            Department Name
            <input required value={form.name} onChange={(event) => onChange('name', event.target.value)} />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event) => onChange('description', event.target.value)} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => onChange('status', event.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <footer>
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="green-action" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Department'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function AdminDepartmentsPage() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true)
      if (!getSession()) {
        navigate('/login')
        return
      }

      setDepartments((await getDepartments()).departments || [])
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDepartments().catch((err) => setError(err.message))
  }, [loadDepartments])

  const filteredDepartments = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return departments

    return departments.filter((department) => (
      department.name?.toLowerCase().includes(search)
      || department.description?.toLowerCase().includes(search)
    ))
  }, [departments, query])

  const openCreate = () => {
    setError('')
    setSuccess('')
    setEditingDepartment(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  const openEdit = (department) => {
    setError('')
    setSuccess('')
    setEditingDepartment(department)
    setForm({
      name: department.name || '',
      description: department.description || '',
      status: department.status || 'active',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDepartment(null)
    setForm(emptyForm)
  }

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment._id, form)
        setSuccess('Department updated successfully.')
      } else {
        await createDepartment(form)
        setSuccess('Department created successfully.')
      }
      closeModal()
      await loadDepartments()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (department) => {
    if (!window.confirm(`Delete ${department.name}?`)) return

    try {
      setError('')
      setSuccess('')
      await deleteDepartment(department._id)
      setSuccess('Department deleted successfully.')
      await loadDepartments()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-account-page hr-page">
        <header className="admin-page-head">
          <div>
            <h1>Departments</h1>
            <p>Manage company departments and their structures.</p>
          </div>
          <button className="green-action" type="button" onClick={openCreate}>
            <Icon name="plus" size={18} />
            New Department
          </button>
        </header>

        <section className="hr-search-card">
          <div className="member-search wide">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search Departments"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </section>

        <section className="hr-table-card departments-table">
          {error && <p className="page-error">{error}</p>}
          {success && <p className="page-success">{success}</p>}
          <div className="hr-table-row header">
            <span>Department</span>
            <span>Description</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {loading && !departments.length ? (
            <PageLoader label="Loading departments..." />
          ) : filteredDepartments.map((department) => (
            <div className="hr-table-row" key={department._id || department.name}>
              <div className="department-name">
                <span><Icon name="building" size={21} /></span>
                <strong>{department.name}</strong>
              </div>
              <p>{department.description || '-'}</p>
              <span className="active-pill">{department.status || 'active'}</span>
              <div className="action-cell">
                <button type="button" aria-label={`Edit ${department.name}`} onClick={() => openEdit(department)}>
                  <Icon name="pencil" size={16} />
                </button>
                <button type="button" aria-label={`Delete ${department.name}`} onClick={() => handleDelete(department)}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
          {!loading && !filteredDepartments.length && (
            <div className="hr-table-row">
              <div className="department-name">
                <span><Icon name="building" size={21} /></span>
                <strong>No departments yet</strong>
              </div>
              <p>Create departments from the admin system when ready.</p>
              <span className="active-pill">Empty</span>
              <div className="action-cell">-</div>
            </div>
          )}
        </section>

        {isModalOpen && (
          <DepartmentModal
            editingDepartment={editingDepartment}
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

export default AdminDepartmentsPage
