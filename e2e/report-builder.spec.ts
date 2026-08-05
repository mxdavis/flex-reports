import { expect, test } from '@playwright/test'

async function enterEditMode(page: Parameters<typeof test>[0]['page']) {
  await page.getByRole('button', { name: 'Edit mode' }).click()
  await expect(page.getByRole('button', { name: 'View mode' })).toBeVisible()
}

function getMappingSection(page: Parameters<typeof test>[0]['page']) {
  return page.locator('section', {
    has: page.getByRole('heading', { name: 'Column Mapping' }),
  })
}

test('table controls expose aggregate options and vertical header semantics', async ({ page }) => {
  await page.goto('/')

  const aggregateSelect = page.locator('#aggregate-mode')
  await expect(aggregateSelect).toBeVisible()
  await expect(aggregateSelect.locator('option')).toHaveText(['None', 'Sum', 'Average', 'Count', 'Distinct Count'])

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

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 1' }).click()
  await mappingSection.getByRole('textbox', { name: 'COLUMN' }).first().fill('personName')
  await mappingSection.getByRole('button', { name: 'Save COLUMN 1' }).click()

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 2' }).click()
  await mappingSection.getByRole('textbox', { name: 'COLUMN' }).first().fill('clientName')
  await mappingSection.getByRole('button', { name: 'Save COLUMN 2' }).click()

  const aggregateSelect = page.locator('#aggregate-mode')
  await aggregateSelect.selectOption('sum')

  const groupedTotalHeaders = page.getByRole('rowheader', { name: / Total$/ })
  await expect(groupedTotalHeaders).toHaveCount(0)

  await page.getByRole('button', { name: 'Grouping' }).click()

  await expect(groupedTotalHeaders.first()).toBeVisible()
})

test('grouped count shows row count once in the left total label', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  const mappingSection = getMappingSection(page)

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 2' }).click()
  await mappingSection.getByRole('textbox', { name: 'COLUMN' }).first().fill('clientName')
  await mappingSection.getByRole('button', { name: 'Save COLUMN 2' }).click()

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 3' }).click()
  await mappingSection.getByRole('textbox', { name: 'COLUMN' }).first().fill('originatingPersonId')
  await mappingSection.getByRole('button', { name: 'Save COLUMN 3' }).click()

  const aggregateSelect = page.locator('#aggregate-mode')
  await aggregateSelect.selectOption('count')

  await page.getByRole('button', { name: 'Grouping' }).click()

  const totalRow = page.locator('tr', {
    has: page.getByRole('rowheader', { name: '07/01/2026 Count Total 3' }),
  })
  await expect(totalRow).toBeVisible()

  const totalCells = await totalRow.locator('td').allTextContents()
  for (const cellValue of totalCells) {
    expect(cellValue.trim()).toBe('')
  }

  const singleSubgroupRow = page.locator('tr', {
    has: page.getByRole('rowheader', { name: /^07\/10\/2026$/ }),
  })
  await expect(singleSubgroupRow).toBeVisible()

  const singleRowCells = (await singleSubgroupRow.locator('td').allTextContents()).map((value) => value.trim())
  expect(singleRowCells[0]).toBe('Delta Freight')
  expect(singleRowCells).toContain('p2')
  expect(singleRowCells).toContain('$540.00')
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
  await page.getByRole('button', { name: 'Save' }).click()

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 1' }).click()
  await expect(column1SourceInput).toHaveValue('Gross Renamed')
})

test('add column uses shared field editor controls and persists chip type', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  const mappingSection = getMappingSection(page)
  await mappingSection.getByRole('button', { name: 'Add column' }).click()

  await expect(mappingSection.getByLabel('Column number')).toBeVisible()
  await expect(mappingSection.getByLabel('Data point')).toBeVisible()
  await expect(mappingSection.getByLabel('Display label')).toBeVisible()
  await expect(mappingSection.getByLabel('Display type')).toBeVisible()
  await expect(mappingSection.getByLabel('Chip type')).toBeVisible()

  await mappingSection.getByLabel('Data point').fill('hours')
  await mappingSection.getByLabel('Display label').fill('Hours Rounded')
  await mappingSection.getByLabel('Display type').selectOption('number')
  await mappingSection.getByLabel('Chip type').selectOption('avg')
  await mappingSection.getByRole('button', { name: 'Save column' }).click()

  await expect(mappingSection.getByText('Hours Rounded')).toBeVisible()

  await mappingSection.getByRole('button', { name: 'Edit COLUMN 8' }).click()
  await expect(mappingSection.getByRole('textbox', { name: 'COLUMN' }).first()).toHaveValue('hours')
  await expect(mappingSection.getByLabel('Display type')).toHaveValue('number')
  await expect(mappingSection.getByLabel('Chip type')).toHaveValue('avg')
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
