import type { EditModeToolbarProps } from '../../components/EditModeToolbar'
import type { MappingPanelSectionProps } from '../../components/MappingPanelSection'
import type { SampleRowsSectionProps } from '../../components/SampleRowsSection'
import type { SeedFormulasSectionProps } from '../../components/SeedFormulasSection'
import type { SeedHeaderProps } from '../../components/SeedHeader'
import type { SummaryItem } from '../../components/SeedStats'
import { DEFAULT_SHEET_NAME, EDIT_MODE_JUMP_TARGETS } from '../../config'

type BuildReportBuilderViewPropsArgs = {
  showAuthoring: boolean
  summaryItems: SummaryItem[]
  canSave: boolean
  saveState: { isDirty: boolean, isSaving: boolean, saveError: string, save: () => Promise<void> }
  isEditMode: boolean
  onJumpToSection: (sectionId: string) => void
  onToggleEditMode: () => void
  sheetName: string
  currencySymbol: string
  onSheetNameChange: (value: string) => void
  onCurrencySymbolChange: (value: string) => void
  mappingPanelProps: MappingPanelSectionProps
  seedFormulasProps: SeedFormulasSectionProps
  sampleRowsProps: Omit<SampleRowsSectionProps, 'sheetName'>
}

export function buildReportBuilderViewProps({
  showAuthoring,
  summaryItems,
  canSave,
  saveState,
  isEditMode,
  onJumpToSection,
  onToggleEditMode,
  sheetName,
  currencySymbol,
  onSheetNameChange,
  onCurrencySymbolChange,
  mappingPanelProps,
  seedFormulasProps,
  sampleRowsProps: tableSectionProps,
}: BuildReportBuilderViewPropsArgs) {
  const editModeToolbarProps: EditModeToolbarProps = {
    isEditMode,
    canSave,
    isDirty: saveState.isDirty,
    isSaving: saveState.isSaving,
    saveError: saveState.saveError,
    onSave: () => {
      void saveState.save()
    },
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
    ...tableSectionProps,
    sheetName: sheetName.trim().length > 0 ? sheetName : DEFAULT_SHEET_NAME,
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
