import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

const COMPONENT_DIRS = [
  'src/components',
  'src/features/reportBuilder/components',
  'src/features/reportBuilder/sections',
  'src/shared/components',
]

const MAX_COMPONENT_LINES = 220
// Every other source file (hooks, models, services): split it before it grows past this.
const MAX_SOURCE_LINES = 250
// The builder is embedded in host pages, so its classes are namespaced to
// avoid clashing with the host's CSS. index.css styles only the app's page.
const CSS_CLASS_PREFIX = 'fr-'
const CSS_PREFIX_EXEMPT = new Set(['src/index.css'])

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

function validateCssClassPrefix(filePath, failures) {
  const text = readFileSync(filePath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import[^;]*;/g, '')
    .replace(/\{[^{}]*\}/g, '{}')
  const classNames = new Set(text.match(/\.[a-zA-Z][\w-]*/g) ?? [])
  for (const className of classNames) {
    if (!className.startsWith(`.${CSS_CLASS_PREFIX}`)) {
      failures.push(`CSS class without "${CSS_CLASS_PREFIX}" prefix: ${className} in ${filePath}`)
    }
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

  for (const filePath of listFilesRecursive('src')) {
    if (filePath.endsWith('.css') && !CSS_PREFIX_EXEMPT.has(filePath)) {
      validateCssClassPrefix(filePath, failures)
    }
  }

  const componentFiles = new Set(COMPONENT_DIRS.flatMap((dirPath) => listFilesRecursive(dirPath)))
  for (const filePath of listFilesRecursive('src')) {
    const isSource = /\.tsx?$/.test(filePath) && !/\.test\.tsx?$/.test(filePath)
    if (isSource && !componentFiles.has(filePath)) validateLineLimit(filePath, MAX_SOURCE_LINES, failures)
  }

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
