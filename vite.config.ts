
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Eliminamos el bloque 'define' que causaba el fallo en las variables de entorno
});
