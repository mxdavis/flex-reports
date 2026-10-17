import type { ReportRow, SchemaField } from '../../services/adapters'
import type { ReportDefinition } from '../../services/reportDefinition/types'

export type { AggregationMode, TableOrientation } from '../../services/reportDefinition/types'

export type ReportRole = 'editor' | 'viewer'

export type ReportBuilderAppProps = {
  // Columns available on `rows`. Inferred from the first row when omitted.
  schema?: SchemaField[]
  // Host data. While it's undefined the builder shows "Loading report…".
  rows?: ReportRow[]
  // Saved report to start from. Defaults are generated from the schema when omitted.
  reportDefinition?: ReportDefinition
  // Viewers can explore but never save. Hosts must still check permissions in onSave.
  role?: ReportRole
  // Called with the full definition when an editor clicks Save. Throw/reject to show an error.
  onSave?: (definition: ReportDefinition) => void | Promise<void>
  initialEditMode?: boolean
  // Grouped reports open at the deepest Show rows level that stays within this
  // many rows. Defaults to 1,000. Ungrouped tables aren't capped.
  maxVisibleRows?: number
  // Runs on built-in sample data with localStorage saving, for local
  // development and demos. Host apps never set this; rows/schema are ignored.
  sandbox?: boolean
}
