import logo from '../../assets/logo.png'

function BrandMark({ compact = false }) {
  return (
    <div className={compact ? 'brand-mark compact' : 'brand-mark'}>
      <img className="brand-logo-image" src={logo} alt="FKHASIA" />
    </div>
  )
}

export default BrandMark
