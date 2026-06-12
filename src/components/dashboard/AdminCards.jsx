import Icon from '../icons/Icon'

export function MetricCard({ card }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${card.tone}`}>
        <Icon name={card.icon} size={30} />
      </div>
      <span className={`chip ${card.tone}`}>{card.chip}</span>
      <strong>{card.value}</strong>
      <p>{card.label}</p>
    </article>
  )
}

export function ApprovalCard({ card }) {
  return (
    <article className="approval-card">
      <div className={`metric-icon small ${card.tone}`}>
        <Icon name={card.icon} size={24} />
      </div>
      <strong>{card.value}</strong>
      <p>{card.label}</p>
    </article>
  )
}

export function ApprovalQueue({ rows }) {
  return (
    <article className="queue-card">
      <div className="card-head">
        <h2>Approval Queue</h2>
        <div>
          <span className="status-pill">Pending</span>
          <button type="button">Manage All</button>
        </div>
      </div>
      <div className="queue-table">
        <div className="table-row header">
          <span>Requester</span>
          <span>Type</span>
          <span>Details</span>
          <span>Action</span>
        </div>
        {rows.map((row) => (
          <div className="table-row" key={`${row.requester}-${row.type}`}>
            <span className="requester">
              <b>{row.initial}</b>
              <span>
                {row.requester}
                <small>N/A</small>
              </span>
            </span>
            <span className={row.type === 'LEAVE' ? 'type leave' : 'type'}>{row.type}</span>
            <span>{row.details}</span>
            <button type="button">Review</button>
          </div>
        ))}
        {!rows.length && (
          <div className="table-row">
            <span>No pending requests</span>
            <span>-</span>
            <span>-</span>
            <span>-</span>
          </div>
        )}
      </div>
      <button className="queue-link" type="button">
        Review Pending Records
      </button>
    </article>
  )
}
