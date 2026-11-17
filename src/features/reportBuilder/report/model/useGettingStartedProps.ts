import type { GettingStartedProps } from '../../components/GettingStarted'
import { MAX_REPORT_COLUMNS } from '../../config'
import { createFieldColumn } from '../../../../services/reportDefinition/normalize'
import { getNextSequencedName } from '../../../../utils/reportBuilder'
import { useReportBuilder } from '../useReportBuilder'

// Getting started: tick a field to add it as the last column, untick to remove
// the columns showing it. Null once the report is saved with columns.
export function useGettingStartedProps(): GettingStartedProps | null {
  const { state } = useReportBuilder()
  const { fields, setFields, sourceColumns, ui, dispatchUi } = state
  if (!state.showGettingStarted) return null

  const selectedKeys = fields.map((field) => field.sourceKey)

  function toggleField(key: string): void {
    if (selectedKeys.includes(key)) {
      const removedIds = fields.filter((field) => field.sourceKey === key).map((field) => field.id)
      setFields((previous) => previous.filter((field) => !removedIds.includes(field.id)))
      if (ui.editingField && removedIds.includes(ui.editingField.id)) dispatchUi({ type: 'stopEditField' })
      return
    }
    const column = sourceColumns.find((candidate) => candidate.key === key)
    if (!column) return
    setFields((previous) => (previous.length >= MAX_REPORT_COLUMNS ? previous : [
      ...previous,
      createFieldColumn(column, getNextSequencedName('field-', previous.map((field) => field.id))),
    ]))
  }

  return {
    fields: sourceColumns.map((column) => ({ key: column.key, label: column.key })),
    selectedKeys,
    rowCount: state.rows.length,
    canAddMore: fields.length < MAX_REPORT_COLUMNS,
    onToggleField: toggleField,
  }
}
