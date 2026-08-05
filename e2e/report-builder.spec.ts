import { expect, test } from '@playwright/test'

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

  const column1SourceInput = page.getByLabel('column1')
  await column1SourceInput.fill('grossFees')
  await expect(column1SourceInput).toHaveValue('grossFees')

  await page.getByRole('button', { name: 'Edit' }).first().click()

  const formulaLabelInput = page.locator('#edit-label-grossFees')
  await formulaLabelInput.fill('Gross Renamed')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(column1SourceInput).toHaveValue('Gross Renamed')
})

test('typing {{ in formula expression opens token suggestions', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Add formula' }).click()

  const expressionInput = page.getByLabel('Expression')
  await expressionInput.fill('{{')

  await expect(page.getByRole('listbox', { name: 'Formula token suggestions' })).toBeVisible()
})
