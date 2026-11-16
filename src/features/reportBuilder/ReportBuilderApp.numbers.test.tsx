import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SchemaField } from '../../services/adapters'
import { generateDefaultReportDefinition } from '../../services/reportDefinition/normalize'
import type { ReportDefinition } from '../../services/reportDefinition/types'
import { installMemoryStorage } from '../../test/memoryStorage'
import ReportBuilderApp from './ReportBuilderApp'

const schema: SchemaField[] = [
  { id: 'task', key: 'task', label: 'Task', dataType: 'string' },
  { id: 'hours', key: 'hours', label: 'Hours', dataType: 'number' },
]

function buildDefinition(): ReportDefinition {
  const definition = generateDefaultReportDefinition(schema, [{ label: 'Double', expression: '{{hours}} * 2' }])
  definition.fields = [
    ...definition.fields,
    { id: 'double', label: 'Double', sourceKey: '%Double', displayType: 'number', aggregation: 'sum' },
  ]
  return definition
}

function cellTexts(): string[] {
  return within(screen.getByRole('table')).getAllByRole('cell').map((cell) => cell.textContent ?? '')
}

describe('numbers in the data', () => {
  beforeEach(() => {
    installMemoryStorage()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: () => undefined, configurable: true })
  })

  it('reads plain numbers and numbers with comma thousands', () => {
    const rows = [{ task: 'Draft', hours: '1,250' }, { task: 'Review', hours: 2000 }]
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={buildDefinition()} role="viewer" />)
    expect(cellTexts()).toEqual(['Draft', '1,250.00', '2,500', 'Review', '2,000.00', '4,000'])
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows other text as typed and warns on the column and on formulas using it', () => {
    const rows = [{ task: 'Draft', hours: '$40' }, { task: 'Review', hours: '2' }]
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={buildDefinition()} role="viewer" />)
    expect(cellTexts()).toEqual(['Draft', '$40', '0', 'Review', '2.00', '4'])
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Column Hours: 1 value isn\'t a number (row 1: "$40").')
    expect(alert).toHaveTextContent('Formula Double: hours has 1 value that isn\'t a number (row 1: "$40"). It\'s counted as 0.')
  })
})
