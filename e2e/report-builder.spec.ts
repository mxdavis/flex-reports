import { expect, test } from '@playwright/test'

async function enterEditMode(page: Parameters<typeof test>[0]['page']) {
  await page.getByRole('button', { name: 'Edit mode' }).click()
  await expect(page.getByRole('button', { name: 'View mode' })).toBeVisible()
}

async function setColumnSource(
  page: Parameters<typeof test>[0]['page'],
  mappingSection: ReturnType<typeof getMappingSection>,
  column: number,
  sourceKey: string,
) {
  await mappingSection.getByRole('button', { name: `Edit COLUMN ${column}` }).click()
  await mappingSection.getByRole('textbox', { name: 'COLUMN' }).first().fill(sourceKey)
  await mappingSection.getByRole('button', { name: `Save COLUMN ${column}` }).click()
}

function getMappingSection(page: Parameters<typeof test>[0]['page']) {
  return page.locator('section', {
    has: page.getByRole('heading', { name: 'Column Mapping' }),
  })
}

test('table controls expose the totals toggle and vertical header semantics', async ({ page }) => {
  await page.goto('/')

  const totalsButton = page.getByRole('button', { name: 'Totals' })
  await expect(totalsButton).toHaveAttribute('aria-pressed', 'false')
  await totalsButton.click()
  await expect(totalsButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('rowheader', { name: 'Total', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Vertical view' }).click()
  await expect(page.getByRole('button', { name: 'Horizontal view' })).toBeVisible()

  const firstHeaderCell = page.locator('.seed-table table thead th').first()
  await expect(firstHeaderCell).not.toHaveText('Field')
  await expect(firstHeaderCell).not.toHaveText('Column 1')
})

test('grouping toggle enables grouped totals layout', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)
  const mappingSection = getMappingSection(page)
  await setColumnSource(page, mappingSection, 1, 'personName')
  await setColumnSource(page, mappingSection, 2, 'clientName')

  await page.getByRole('button', { name: 'Totals' }).click()

  const groupedTotalHeaders = page.getByRole('rowheader', { name: / Total$/ })
  await expect(groupedTotalHeaders).toHaveCount(0)

  await page.getByRole('button', { name: 'Grouping' }).click()

  await expect(groupedTotalHeaders.first()).toBeVisible()
})

test('groups collapse and expand by hand and by outline level', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)
  const mappingSection = getMappingSection(page)
  await setColumnSource(page, mappingSection, 1, 'personName')
  await setColumnSource(page, mappingSection, 2, 'clientName')

  await page.getByRole('button', { name: 'Totals' }).click()
  await page.getByRole('button', { name: 'Grouping' }).click()

  const alexButton = page.getByRole('button', { name: 'Alex Rivera', exact: true })
  await expect(alexButton).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('rowheader', { name: 'Alex Rivera Total' })).toBeVisible()

  await alexButton.click()
  await expect(alexButton).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('rowheader', { name: 'Alex Rivera Total' })).toHaveCount(0)

  const outline = page.getByRole('combobox', { name: 'Show rows' })
  await outline.selectOption('0')
  await expect(page.getByRole('button', { name: 'Sam Patel', exact: true })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('rowheader', { name: / Total$/ })).toHaveCount(0)

  await outline.selectOption('all')
  await expect(alexButton).toHaveAttribute('aria-expanded', 'true')
})

test('groups nest up to the first number column, with a total row for every group', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)
  const mappingSection = getMappingSection(page)

  await setColumnSource(page, mappingSection, 1, 'personName')
  await setColumnSource(page, mappingSection, 2, 'clientName')
  await setColumnSource(page, mappingSection, 3, 'task')
  await setColumnSource(page, mappingSection, 4, 'rate')
  await setColumnSource(page, mappingSection, 5, 'grossFees')

  await page.getByRole('button', { name: 'Totals' }).click()
  await page.getByRole('button', { name: 'Grouping' }).click()

  await expect(page.getByRole('rowheader', { name: /^Review Total$/ }).first()).toBeVisible()
  await expect(page.getByRole('rowheader', { name: /^Delta Freight Total$/ }).first()).toBeVisible()
  await expect(page.getByRole('rowheader', { name: /^Alex Rivera Total$/ })).toBeVisible()
  await expect(page.getByRole('rowheader', { name: 'Grand total' })).toBeVisible()
  // Number columns are values, never groups.
  await expect(page.getByRole('rowheader', { name: /^\$?240(\.00)? Total$/ })).toHaveCount(0)
})

test('formula label rename syncs mapped column source', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  const mappingSection = getMappingSection(page)

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 1' }).click()

  const column1SourceInput = mappingSection.getByRole('textbox', { name: 'COLUMN' }).first()
  await column1SourceInput.fill('grossFees')
  await expect(column1SourceInput).toHaveValue('grossFees')
  await mappingSection.getByRole('button', { name: 'Save COLUMN 1' }).click()

  const formulasSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Formulas' }),
  })
  await formulasSection.getByRole('button', { name: 'Edit' }).first().click()

  const formulaLabelInput = page.locator('#edit-label-grossFees')
  await formulaLabelInput.fill('Gross Renamed')
  await formulasSection.getByRole('button', { name: 'Save', exact: true }).click()

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 1' }).click()
  await expect(column1SourceInput).toHaveValue('Gross Renamed')
})

test('add column uses shared field editor controls and persists total type', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  const mappingSection = getMappingSection(page)
  await mappingSection.getByRole('button', { name: 'Add column' }).click()

  await expect(mappingSection.getByLabel('Column number')).toBeVisible()
  await expect(mappingSection.getByLabel('Data point')).toBeVisible()
  await expect(mappingSection.getByLabel('Display label')).toBeVisible()
  await expect(mappingSection.getByLabel('Display type')).toBeVisible()
  await expect(mappingSection.getByLabel('Total type')).toBeVisible()

  await mappingSection.getByLabel('Data point').fill('hours')
  await mappingSection.getByLabel('Display label').fill('Hours Rounded')
  await mappingSection.getByLabel('Display type').selectOption('number')
  await mappingSection.getByLabel('Total type').selectOption('avg')
  await mappingSection.getByRole('button', { name: 'Save column' }).click()

  await expect(mappingSection.getByText('Hours Rounded')).toBeVisible()

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 8' }).click()
  await expect(mappingSection.getByRole('textbox', { name: 'COLUMN' }).first()).toHaveValue('hours')
  await expect(mappingSection.getByLabel('Display type')).toHaveValue('number')
  await expect(mappingSection.getByLabel('Total type')).toHaveValue('avg')
})

test('global currency symbol selector updates currency display values', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  await page.getByLabel('Currency symbol').selectOption('₪')

  const totalChip = page.locator('.seed-stats article', {
    has: page.getByRole('heading', { name: /Total \(sum\)/ }),
  })
  await expect(totalChip.locator('strong')).toContainText('₪')

  await expect(page.locator('.seed-table tbody td', { hasText: '₪' }).first()).toBeVisible()
})

test('typing {{ in formula expression opens token suggestions', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  const formulasSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Formulas' }),
  })

  await formulasSection.getByRole('button', { name: 'Add formula' }).click()

  const expressionInput = formulasSection.getByLabel('Expression')
  await expressionInput.fill('{{')

  await expect(page.getByRole('listbox', { name: 'Formula token suggestions' })).toBeVisible()
})
