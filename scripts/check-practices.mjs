import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

const COMPONENT_DIRS = [
  'src/components',
  'src/features/reportBuilder/components',
  'src/features/reportBuilder/sections',
  'src/shared/components',
]

const MAX_COMPONENT_LINES = 220
const MAX_REPORT_APP_LINES = 1000
const REPORT_APP_PATH = 'src/features/reportBuilder/ReportBuilderApp.tsx'
const DRY_SCAN_DIRS = ['src']
const DRY_SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
const DRY_IGNORE_SUFFIXES = ['.test.ts', '.test.tsx']
const DRY_BLOCK_SIZE_LINES = 20

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

function shouldScanForDry(filePath) {
  const extension = extname(filePath)
  if (!DRY_SCAN_EXTENSIONS.has(extension)) {
    return false
  }

  return !DRY_IGNORE_SUFFIXES.some((suffix) => filePath.endsWith(suffix))
}

function normalizeDryLine(line) {
  return line.trim().replace(/\s+/g, ' ')
}

function validateDuplicateBlocks(files, failures) {
  const seenBlocks = new Map()
  const duplicateMessages = new Set()

  for (const filePath of files) {
    const text = readFileSync(filePath, 'utf8')
    const lines = text.split('\n')

    if (lines.length < DRY_BLOCK_SIZE_LINES) {
      continue
    }

    const normalizedLines = lines.map(normalizeDryLine)
    for (let start = 0; start <= normalizedLines.length - DRY_BLOCK_SIZE_LINES; start += 1) {
      const block = normalizedLines.slice(start, start + DRY_BLOCK_SIZE_LINES)
      if (block.some((line) => line.length === 0)) {
        continue
      }

      const hash = block.join('\n')
      const existing = seenBlocks.get(hash)
      const location = { filePath, line: start + 1 }

      if (!existing) {
        seenBlocks.set(hash, location)
        continue
      }

      if (existing.filePath === location.filePath && existing.line === location.line) {
        continue
      }

      const message = [
        `Duplicate ${DRY_BLOCK_SIZE_LINES}-line block detected:`,
        `${existing.filePath}:${existing.line}`,
        `${location.filePath}:${location.line}`,
      ].join(' ')
      duplicateMessages.add(message)
    }
  }

  for (const message of duplicateMessages) {
    failures.push(message)
  }
}

function run() {
  const failures = []
  const dryCandidateFiles = []

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

  for (const dirPath of DRY_SCAN_DIRS) {
    const files = listFilesRecursive(dirPath)
    for (const filePath of files) {
      if (shouldScanForDry(filePath)) {
        dryCandidateFiles.push(filePath)
      }
    }
  }

  validateDuplicateBlocks(dryCandidateFiles, failures)

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
