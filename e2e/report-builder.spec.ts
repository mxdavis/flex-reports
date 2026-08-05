import { expect, test } from '@playwright/test'

async function enterEditMode(page: Parameters<typeof test>[0]['page']) {
  await page.getByRole('button', { name: 'Edit mode' }).click()
  await expect(page.getByRole('button', { name: 'View mode' })).toBeVisible()
}

test('table controls expose aggregate options and vertical header semantics', async ({ page }) => {
  await page.goto('/')

  const aggregateSelect = page.locator('#aggregate-mode')
  await expect(aggregateSelect).toBeVisible()
  await expect(aggregateSelect.locator('option')).toHaveText(['None', 'Sum', 'Average'])

  await page.getByRole('button', { name: 'Vertical view' }).click()
  await expect(page.getByText('Mode: Vertical')).toBeVisible()

  const firstHeaderCell = page.locator('.seed-table table thead th').first()
  await expect(firstHeaderCell).not.toHaveText('Field')
  await expect(firstHeaderCell).not.toHaveText('Column 1')
})

test('formula label rename syncs mapped column source', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  await page.getByRole('button', { name: 'Edit COLUMN 1' }).click()

  const column1SourceInput = page.locator('#mapping-date')
  await column1SourceInput.fill('grossFees')
  await expect(column1SourceInput).toHaveValue('grossFees')
  await page.getByRole('button', { name: 'Save COLUMN 1' }).click()

  const formulasSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Seeded formulas' }),
  })
  await formulasSection.getByRole('button', { name: 'Edit' }).first().click()

  const formulaLabelInput = page.locator('#edit-label-grossFees')
  await formulaLabelInput.fill('Gross Renamed')
  await page.getByRole('button', { name: 'Save' }).click()

  await page.getByRole('button', { name: 'Edit COLUMN 1' }).click()
  await expect(column1SourceInput).toHaveValue('Gross Renamed')
})

test('typing {{ in formula expression opens token suggestions', async ({ page }) => {
  await page.goto('/')

  await enterEditMode(page)

  const formulasSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Seeded formulas' }),
  })

  await formulasSection.getByRole('button', { name: 'Add formula' }).click()

  const expressionInput = formulasSection.getByLabel('Expression')
  await expressionInput.fill('{{')

  await expect(page.getByRole('listbox', { name: 'Formula token suggestions' })).toBeVisible()
})
