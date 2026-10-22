/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'mock' | 'dataverse';
  readonly VITE_DATAVERSE_URL?: string;
}
