import type { ReportFormula } from '../../../services/adapters'
import type { ReportField, ReportView } from '../../../services/reportDefinition/types'
import type { TableOrientation } from '../types'

export type FormulaDraft = {
  // The label before editing, so a rename can update columns that use it.
  originalLabel: string
  draft: ReportFormula
}

export type NewColumnDraft = {
  // 1-based column number the new column is inserted at.
  position: number
  draft: ReportField
}

export type UiState = {
  isEditMode: boolean
  isAddingFormula: boolean
  // The Add column form, or null when it's closed.
  newColumn: NewColumnDraft | null
  // The column being edited, as an unsaved draft (its id is the column's id).
  editingField: ReportField | null
  editingFormula: FormulaDraft | null
  draggedFieldId: string | null
  dragOverFieldId: string | null
  tableOrientation: TableOrientation
  showTotals: boolean
  isGroupingEnabled: boolean
  expandedLevels: number | null
  // Groups the user opened or closed by hand, keyed by group path. Session
  // only: never saved, cleared whenever the outline level changes.
  groupOverrides: Record<string, boolean>
  isTableFullscreen: boolean
}

type ToggleKey = 'showTotals' | 'isGroupingEnabled' | 'isTableFullscreen'

// Plain value changes go through `set`; the other actions change several
// fields together, which is what the reducer is for.
export type UiAction =
  | { type: 'set', changes: Partial<UiState> }
  | { type: 'toggle', key: ToggleKey }
  | { type: 'toggleEditMode' }
  | { type: 'toggleOrientation' }
  | { type: 'setExpandedLevels', value: number | null }
  | { type: 'setGroupExpanded', groupKey: string, isExpanded: boolean }
  | { type: 'patchNewColumn', changes: Partial<ReportField>, position?: number }
  | { type: 'startEditField', field: ReportField }
  | { type: 'patchEditField', changes: Partial<ReportField> }
  | { type: 'stopEditField' }
  | { type: 'startEditFormula', formula: ReportFormula }
  | { type: 'patchEditFormula', changes: Partial<ReportFormula> }
  | { type: 'stopEditFormula' }

export function createInitialUiState(args: { initialEditMode: boolean, initialView: ReportView }): UiState {
  return {
    isEditMode: args.initialEditMode,
    isAddingFormula: false,
    newColumn: null,
    editingField: null,
    editingFormula: null,
    draggedFieldId: null,
    dragOverFieldId: null,
    tableOrientation: args.initialView.orientation,
    showTotals: args.initialView.showTotals,
    isGroupingEnabled: args.initialView.isGroupingEnabled,
    expandedLevels: args.initialView.expandedLevels,
    groupOverrides: {},
    isTableFullscreen: false,
  }
}

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.changes }
    case 'toggle':
      return { ...state, [action.key]: !state[action.key] }
    // Leaving or entering edit mode closes any half-open add forms.
    case 'toggleEditMode':
      return { ...state, isEditMode: !state.isEditMode, isAddingFormula: false, newColumn: null }
    // Grouping and totals are kept as-is: they simply don't apply in vertical
    // view, and come back when switching to horizontal.
    case 'toggleOrientation':
      return { ...state, tableOrientation: state.tableOrientation === 'horizontal' ? 'vertical' : 'horizontal' }
    case 'setExpandedLevels':
      return { ...state, expandedLevels: action.value, groupOverrides: {} }
    case 'setGroupExpanded':
      return { ...state, groupOverrides: { ...state.groupOverrides, [action.groupKey]: action.isExpanded } }
    case 'patchNewColumn':
      return state.newColumn
        ? {
          ...state,
          newColumn: {
            position: action.position ?? state.newColumn.position,
            draft: { ...state.newColumn.draft, ...action.changes },
          },
        }
        : state
    case 'startEditField':
      return { ...state, editingField: { ...action.field } }
    case 'patchEditField':
      return state.editingField ? { ...state, editingField: { ...state.editingField, ...action.changes } } : state
    case 'stopEditField':
      return { ...state, editingField: null }
    case 'startEditFormula':
      return { ...state, editingFormula: { originalLabel: action.formula.label, draft: { ...action.formula } } }
    case 'patchEditFormula':
      return state.editingFormula
        ? { ...state, editingFormula: { ...state.editingFormula, draft: { ...state.editingFormula.draft, ...action.changes } } }
        : state
    case 'stopEditFormula':
      return { ...state, editingFormula: null }
    default:
      return state
  }
}
