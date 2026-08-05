type ChevronToggleIconProps = {
  direction: 'up' | 'down'
}

function ChevronToggleIcon({ direction }: ChevronToggleIconProps) {
  const path = direction === 'up' ? 'M4 10L8 6L12 10' : 'M4 6L8 10L12 6'

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ChevronToggleIcon
