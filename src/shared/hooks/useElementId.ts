import { createContext, useContext } from 'react'

// Element IDs are prefixed per builder instance (see ReportBuilderProvider), so
// two builders on one page never share an ID. Outside a provider, e.g. a
// component rendered alone in a test, the prefix is just "fr".
export const ElementIdPrefixContext = createContext('fr')

export function useElementIdPrefix(): string {
  return useContext(ElementIdPrefixContext)
}

export function useElementId(name: string): string {
  return `${useElementIdPrefix()}-${name}`
}
