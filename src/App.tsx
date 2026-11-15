import { useMemo } from 'react'
import ReportBuilderApp from './features/reportBuilder/ReportBuilderApp'
import type { ReportBuilderAppProps, ReportDefinition } from './features/reportBuilder/types'
import { getBillingSeed, getReportRows, getSchema } from './services/adapters'
import { loadReportData, saveReportData } from './services/reportDefinition/storage'
import { loadFormulaData, saveFormulaData } from './services/reportDefinition/formulaStorage'
import { CURRENCY_SYMBOL_STORAGE_KEY, SHEET_NAME_STORAGE_KEY } from './features/reportBuilder/config'

function saveDemoSettings(definition: ReportDefinition) {
  saveReportData({ version: 4, fields: definition.fields })
  saveFormulaData(definition.formulas)
  try {
    window.localStorage.setItem(SHEET_NAME_STORAGE_KEY, definition.sheetName)
    window.localStorage.setItem(CURRENCY_SYMBOL_STORAGE_KEY, definition.currencySymbol)
  } catch {
    console.warn('Demo report settings could not be saved in this browser.')
  }
}

function App(props: Partial<ReportBuilderAppProps>) {
  const demo = useMemo(() => {
    const definition: Partial<ReportDefinition> = {
      fields: loadReportData(getSchema()).fields,
      formulas: loadFormulaData(getBillingSeed().formulas),
    }
    try {
      definition.sheetName = window.localStorage.getItem(SHEET_NAME_STORAGE_KEY) || undefined
      definition.currencySymbol = window.localStorage.getItem(CURRENCY_SYMBOL_STORAGE_KEY) || undefined
    } catch {
      console.warn('Demo report settings could not be loaded from this browser.')
    }
    return { records: getReportRows(), definition }
  }, [])
  return <ReportBuilderApp
    records={demo.records}
    initialReportDefinition={demo.definition}
    canEditReport={import.meta.env.VITE_CAN_EDIT_REPORT !== 'false'}
    onReportDefinitionChange={saveDemoSettings}
    {...props}
  />
}

export default App
