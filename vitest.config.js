import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Ejecutar los archivos de test de forma secuencial para evitar
    // conflictos en la BD (un test limpia datos que otro necesita)
    fileParallelism: false,
    // Timeout generoso para tests que interactúan con la BD
    testTimeout: 10000,
    // Excluir frontend ya que usa un entorno de navegador (jsdom) no configurado en la raíz
    exclude: ["frontend/**", "node_modules/**"],
  },
});
