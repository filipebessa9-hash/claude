import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.expo/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/expo-env.d.ts',
      '**/next-env.d.ts',
      '**/*.config.js',
      '**/babel.config.js',
      '**/metro.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Dados sensíveis nunca devem ir para logs (Seção 7 do CLAUDE.md);
      // console.* fica proibido por padrão para forçar uso consciente.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
);
