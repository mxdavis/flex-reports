import { useContext } from 'react'
import { PrintModeContext } from '../../../shared/hooks/usePrintMode'
import './PrintStamp.css'

const PRINT_DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' })

// "Printed October 18, 2026 at 3:05 AM" under the report title, on paper only.
function PrintStamp() {
  const isPrinting = useContext(PrintModeContext)
  if (!isPrinting) return null
  return <p className="fr-print-stamp">Printed {PRINT_DATE_FORMAT.format(new Date())}</p>
}

export default PrintStamp
