import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// Minimal configuration: the rules recommended by Next.js for React,
// accessibility basics, Core Web Vitals and TypeScript.
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts']),
])
