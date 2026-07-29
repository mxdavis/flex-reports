/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'seed'
  readonly VITE_CAN_EDIT_REPORT?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
