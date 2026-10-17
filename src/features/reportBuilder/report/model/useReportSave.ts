import { useEffect, useState } from 'react'
import { saveSandboxDefinition } from '../../../../services/reportDefinition/storage'
import type { ReportDefinition } from '../../../../services/reportDefinition/types'

type UseReportSaveArgs = {
  definition: ReportDefinition
  initialDefinition: ReportDefinition
  canSave: boolean
  isSandbox: boolean
  onSave?: (definition: ReportDefinition) => void | Promise<void>
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Could not save the report.'
}

// Explicit save: edits stay local until Save, so half-finished changes never
// reach everyone viewing the report. The last saved definition is the baseline.
export function useReportSave({ definition, initialDefinition, canSave, isSandbox, onSave }: UseReportSaveArgs) {
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialDefinition))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const currentJson = JSON.stringify(definition)
  const isDirty = canSave && currentJson !== savedJson

  useEffect(() => {
    if (!isDirty) return
    function warnBeforeLeaving(event: BeforeUnloadEvent): void {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isDirty])

  async function save(): Promise<void> {
    if (!canSave || isSaving) return
    setIsSaving(true)
    setSaveError('')
    try {
      if (isSandbox) {
        saveSandboxDefinition(definition)
      } else {
        await onSave?.(definition)
      }
      setSavedJson(currentJson)
    } catch (error) {
      console.error('[flex-reports] Saving the report definition failed.', error)
      setSaveError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return { isDirty, isSaving, saveError, save }
}
