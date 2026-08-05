import type { RefObject } from 'react'
import type { EditModeToolbarProps } from '../../components/EditModeToolbar'
import type { MappingPanelSectionProps } from '../../components/MappingPanelSection'
import type { SampleRowsSectionProps } from '../../components/SampleRowsSection'
import type { SeedFormulasSectionProps } from '../../components/SeedFormulasSection'
import type { SeedHeaderProps } from '../../components/SeedHeader'
import type { SummaryItem } from '../../components/SeedStats'
import { DEFAULT_SHEET_NAME, EDIT_MODE_JUMP_TARGETS } from '../../config'
import type { AggregateMode } from '../../types'
import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'

type BuildReportBuilderViewPropsArgs = {
  showAuthoring: boolean
  summaryItems: SummaryItem[]
  canEditReport: boolean
  isEditMode: boolean
  onJumpToSection: (sectionId: string) => void
  onToggleEditMode: () => void
  sheetName: string
  currencySymbol: string
  onSheetNameChange: (value: string) => void
  onCurrencySymbolChange: (value: string) => void
  mappingPanelProps: MappingPanelSectionProps
  seedFormulasProps: SeedFormulasSectionProps
  isTableFullscreen: boolean
  isHorizontalTable: boolean
  aggregateMode: AggregateMode
  showTotals: boolean
  fields: ReportField[]
  previewRows: ReportRow[]
  verticalColumns: Array<{ key: string, headerValue: string, rows: ReportRow[] }>
  tableScrollRef: RefObject<HTMLDivElement | null>
  onAggregateModeChange: (value: AggregateMode) => void
  onToggleOrientation: () => void
  onToggleFullscreen: () => void
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, localCurrencySymbol?: string) => string
  getAggregatedFieldValue: (rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregateMode) => number | null
  formatValue: (value: number | null, displayType: DisplayType) => string
}

export function buildReportBuilderViewProps({
  showAuthoring,
  summaryItems,
  canEditReport,
  isEditMode,
  onJumpToSection,
  onToggleEditMode,
  sheetName,
  currencySymbol,
  onSheetNameChange,
  onCurrencySymbolChange,
  mappingPanelProps,
  seedFormulasProps,
  isTableFullscreen,
  isHorizontalTable,
  aggregateMode,
  showTotals,
  fields,
  previewRows,
  verticalColumns,
  tableScrollRef,
  onAggregateModeChange,
  onToggleOrientation,
  onToggleFullscreen,
  getMappedValue,
  getAggregatedFieldValue,
  formatValue,
}: BuildReportBuilderViewPropsArgs) {
  const editModeToolbarProps: EditModeToolbarProps = {
    canEditReport,
    isEditMode,
    jumpTargets: EDIT_MODE_JUMP_TARGETS,
    onJumpToSection,
    onToggle: onToggleEditMode,
  }
  const seedHeaderProps: SeedHeaderProps = {
    sheetName,
    currencySymbol,
    onSheetNameChange,
    onCurrencySymbolChange,
  }
  const sampleRowsProps: SampleRowsSectionProps = {
    sheetName: sheetName.trim().length > 0 ? sheetName : DEFAULT_SHEET_NAME,
    isTableFullscreen,
    isHorizontalTable,
    aggregateMode,
    showTotals,
    fields,
    previewRows,
    verticalColumns,
    tableScrollRef,
    onAggregateModeChange,
    onToggleOrientation,
    onToggleFullscreen,
    getMappedValue,
    getAggregatedFieldValue,
    formatValue,
  }

  return {
    showAuthoring,
    summaryItems,
    editModeToolbarProps,
    seedHeaderProps,
    mappingPanelProps,
    seedFormulasProps,
    sampleRowsProps,
  }
}
