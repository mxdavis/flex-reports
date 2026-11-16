// Characters most file systems don't allow in a file name, plus control characters.
const UNSAFE_FILE_NAME_CHARACTERS = /[\\/:*?"<>|\p{Cc}]+/gu

export function toFileName(name: string, extension: string, fallback = 'Report'): string {
  const base = name.replace(UNSAFE_FILE_NAME_CHARACTERS, '-').trim() || fallback
  return `${base}.${extension}`
}

// Saves generated content as a file, through a temporary link.
export function downloadFile(fileName: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoked a moment later: Safari can cancel a download whose URL is revoked at once.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
