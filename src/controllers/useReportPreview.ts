import { useMemo } from 'react'
import type { PivotRow, TimeslipRow } from '../models/reportTypes'
import { evaluateExpression } from '../services/formula/formulaService'
import { pivotByEmployee } from '../services/pivot/pivotService'

export type PreviewRow = TimeslipRow & {
  grossFees: number
  writeDown: number
  netFees: number
}

export function useReportPreview(rows: TimeslipRow[]): {
  previewRows: PreviewRow[]
  pivotRows: PivotRow[]
} {
  const previewRows = useMemo(() => {
    return rows.map((row) => {
      const grossFees = evaluateExpression('{{hours}} * {{rate}}', {
        hours: row.hours,
        rate: row.rate,
      })

      const writeDown = evaluateExpression('{{grossFees}} * 10%', {
        grossFees,
      })

      const netFees = evaluateExpression('{{grossFees}} - {{writeDown}}', {
        grossFees,
        writeDown,
      })

      return {
        ...row,
        grossFees,
        writeDown,
        netFees,
      }
    })
  }, [rows])

  const pivotRows = useMemo(() => pivotByEmployee(rows), [rows])

  return { previewRows, pivotRows }
}
