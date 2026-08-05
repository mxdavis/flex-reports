import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

const COMPONENT_DIRS = [
  'src/components',
  'src/features/reportBuilder/components',
]

const MAX_COMPONENT_LINES = 220
const MAX_REPORT_APP_LINES = 1000
const REPORT_APP_PATH = 'src/features/reportBuilder/ReportBuilderApp.tsx'

function listFilesRecursive(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath))
      continue
    }

    files.push(fullPath)
  }

  return files
}

function countLines(filePath) {
  const text = readFileSync(filePath, 'utf8')
  if (text.length === 0) {
    return 0
  }

  return text.split('\n').length
}

function validateComponentPairs(filePath, failures) {
  if (!filePath.endsWith('.tsx') || filePath.endsWith('.test.tsx')) {
    return
  }

  const directory = filePath.slice(0, filePath.lastIndexOf('/'))
  const name = basename(filePath, extname(filePath))
  const cssPath = join(directory, `${name}.css`)
  const testPath = join(directory, `${name}.test.tsx`)

  try {
    statSync(cssPath)
  } catch {
    failures.push(`Missing component stylesheet: ${cssPath}`)
  }

  try {
    statSync(testPath)
  } catch {
    failures.push(`Missing component test file: ${testPath}`)
  }
}

function validateLineLimit(filePath, maxLines, failures) {
  const lineCount = countLines(filePath)
  if (lineCount > maxLines) {
    failures.push(`File too large (${lineCount} lines > ${maxLines}): ${filePath}`)
  }
}

function run() {
  const failures = []

  for (const dirPath of COMPONENT_DIRS) {
    const files = listFilesRecursive(dirPath)
    for (const filePath of files) {
      if (!filePath.endsWith('.tsx')) {
        continue
      }

      validateComponentPairs(filePath, failures)

      if (!filePath.endsWith('.test.tsx')) {
        validateLineLimit(filePath, MAX_COMPONENT_LINES, failures)
      }
    }
  }

  validateLineLimit(REPORT_APP_PATH, MAX_REPORT_APP_LINES, failures)

  if (failures.length > 0) {
    console.error('Practice checks failed:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log('Practice checks passed.')
}

run()
