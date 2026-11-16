import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SchemaField } from '../../services/adapters'
import { generateDefaultReportDefinition } from '../../services/reportDefinition/normalize'
import type { ReportDefinition } from '../../services/reportDefinition/types'
import { installMemoryStorage } from '../../test/memoryStorage'
import ReportBuilderApp from './ReportBuilderApp'

const schema: SchemaField[] = [
  { id: 'task', key: 'task', label: 'Task', dataType: 'string' },
  { id: 'hours', key: 'hours', label: 'Hours', dataType: 'number' },
]
const rows = [{ task: 'Draft', hours: '1,250' }, { task: 'Review', hours: '2' }]

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

describe('number format setting', () => {
  beforeEach(() => {
    installMemoryStorage()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: () => undefined, configurable: true })
  })

  it('reads commas by default', () => {
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={buildDefinition()} role="viewer" />)
    expect(cellTexts()).toEqual(['Draft', '1,250.00', '2,500', 'Review', '2.00', '4'])
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('without commas, keeps values with a comma as typed and warns on the formula using them', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ReportBuilderApp schema={schema} rows={rows} reportDefinition={buildDefinition()} onSave={onSave} initialEditMode />)

    await user.selectOptions(screen.getByLabelText('Number format'), 'plain')

    expect(cellTexts()).toEqual(['Draft', '1,250', '0', 'Review', '2.00', '4'])
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Column Hours: 1 value isn\'t a number (row 1: "1,250").')
    expect(alert).toHaveTextContent('Formula Double: hours has 1 value that isn\'t a number (row 1: "1,250"). It\'s counted as 0.')

    await user.click(screen.getByRole('button', { name: 'Save report' }))
    expect((onSave.mock.calls[0][0] as ReportDefinition).numberFormat).toBe('plain')
  })
})
