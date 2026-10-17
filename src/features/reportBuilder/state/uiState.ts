import type { ReportFormula } from '../../../services/adapters'
import type { ReportField, ReportView } from '../../../services/reportDefinition/types'
import type { TableOrientation } from '../types'

export type UiState = {
  isAddingFormula: boolean
  editingFormulaLabel: string | null
  editingFormula: ReportFormula | null
  editingFieldId: string | null
  editingFieldDraft: ReportField | null
  addColumnPosition: number
  isAddingColumn: boolean
  isEditMode: boolean
  tableOrientation: TableOrientation
  showTotals: boolean
  isGroupingEnabled: boolean
  expandedLevels: number | null
  // Groups the user opened or closed by hand, keyed by group path. Session
  // only: never saved, cleared whenever the outline level changes.
  groupOverrides: Record<string, boolean>
  draggedFieldId: string | null
  dragOverFieldId: string | null
  isTableFullscreen: boolean
}

export type UiInitArgs = {
  initialEditMode: boolean
  initialView: ReportView
}

export type UiAction =
  | { type: 'setIsEditMode', value: boolean }
  | { type: 'toggleEditMode' }
  | { type: 'setIsAddingFormula', value: boolean }
  | { type: 'startEditFormula', label: string, formula: ReportFormula }
  | { type: 'setEditingFormulaState', value: ReportFormula | null }
  | { type: 'updateEditFormula', changes: Partial<ReportFormula> }
  | { type: 'stopEditFormula' }
  | { type: 'startEditField', field: ReportField }
  | { type: 'setEditingFieldDraftState', value: ReportField | null }
  | { type: 'updateEditFieldDraft', changes: Partial<ReportField> }
  | { type: 'stopEditField' }
  | { type: 'setAddColumnPosition', value: number }
  | { type: 'setIsAddingColumn', value: boolean }
  | { type: 'setTableOrientation', value: TableOrientation }
  | { type: 'setShowTotals', value: boolean }
  | { type: 'setIsGroupingEnabled', value: boolean }
  | { type: 'setExpandedLevels', value: number | null }
  | { type: 'setGroupExpanded', groupKey: string, isExpanded: boolean }
  | { type: 'setDraggedFieldId', value: string | null }
  | { type: 'setDragOverFieldId', value: string | null }
  | { type: 'clearDrag' }
  | { type: 'setIsTableFullscreen', value: boolean }
  | { type: 'toggleIsTableFullscreen' }

export function createInitialUiState(args: UiInitArgs): UiState {
  return {
    isAddingFormula: false,
    editingFormulaLabel: null,
    editingFormula: null,
    editingFieldId: null,
    editingFieldDraft: null,
    addColumnPosition: 1,
    isAddingColumn: false,
    isEditMode: args.initialEditMode,
    tableOrientation: args.initialView.orientation,
    showTotals: args.initialView.showTotals,
    isGroupingEnabled: args.initialView.isGroupingEnabled,
    expandedLevels: args.initialView.expandedLevels,
    groupOverrides: {},
    draggedFieldId: null,
    dragOverFieldId: null,
    isTableFullscreen: false,
  }
}

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'setIsEditMode':
      return {
        ...state,
        isEditMode: action.value,
      }
    case 'toggleEditMode':
      return {
        ...state,
        isEditMode: !state.isEditMode,
      }
    case 'setIsAddingFormula':
      return {
        ...state,
        isAddingFormula: action.value,
      }
    case 'startEditFormula':
      return {
        ...state,
        editingFormulaLabel: action.label,
        editingFormula: { ...action.formula },
      }
    case 'setEditingFormulaState':
      return {
        ...state,
        editingFormula: action.value,
      }
    case 'updateEditFormula':
      if (!state.editingFormula) {
        return state
      }

      return {
        ...state,
        editingFormula: {
          ...state.editingFormula,
          ...action.changes,
        },
      }
    case 'stopEditFormula':
      return {
        ...state,
        editingFormulaLabel: null,
        editingFormula: null,
      }
    case 'startEditField':
      return {
        ...state,
        editingFieldId: action.field.id,
        editingFieldDraft: { ...action.field },
      }
    case 'setEditingFieldDraftState':
      return {
        ...state,
        editingFieldDraft: action.value,
      }
    case 'updateEditFieldDraft':
      if (!state.editingFieldDraft) {
        return state
      }

      return {
        ...state,
        editingFieldDraft: {
          ...state.editingFieldDraft,
          ...action.changes,
        },
      }
    case 'stopEditField':
      return {
        ...state,
        editingFieldId: null,
        editingFieldDraft: null,
      }
    case 'setAddColumnPosition':
      return {
        ...state,
        addColumnPosition: action.value,
      }
    case 'setIsAddingColumn':
      return {
        ...state,
        isAddingColumn: action.value,
      }
    case 'setTableOrientation':
      return {
        ...state,
        tableOrientation: action.value,
      }
    case 'setShowTotals':
      return {
        ...state,
        showTotals: action.value,
      }
    case 'setExpandedLevels':
      return {
        ...state,
        expandedLevels: action.value,
        groupOverrides: {},
      }
    case 'setGroupExpanded':
      return {
        ...state,
        groupOverrides: { ...state.groupOverrides, [action.groupKey]: action.isExpanded },
      }
    case 'setIsGroupingEnabled':
      return {
        ...state,
        isGroupingEnabled: action.value,
      }
    case 'setDraggedFieldId':
      return {
        ...state,
        draggedFieldId: action.value,
      }
    case 'setDragOverFieldId':
      return {
        ...state,
        dragOverFieldId: action.value,
      }
    case 'clearDrag':
      return {
        ...state,
        draggedFieldId: null,
        dragOverFieldId: null,
      }
    case 'setIsTableFullscreen':
      return {
        ...state,
        isTableFullscreen: action.value,
      }
    case 'toggleIsTableFullscreen':
      return {
        ...state,
        isTableFullscreen: !state.isTableFullscreen,
      }
    default:
      return state
  }
}
