# Registro de uso de IA (AI Log)

Este documento registra el uso de herramientas de Inteligencia Artificial durante el desarrollo del proyecto, siguiendo las pautas de transparencia y aprendizaje continuo.

---

## 2026-05-15 — Eliminación en cascada en Prisma (Error 500 al borrar usuario)

- **Herramienta:** Gemini 3.1 Pro
- **Contexto:** Tenía un error 500 en Postman al intentar hacer un `DELETE /api/user/me`. Revisando los logs de la terminal vi que era un error de restricción de clave foránea de PostgreSQL. No sabía cómo hacer para que al borrar un usuario, se borrasen sus cosas asociadas sin que rompiera la base de datos.
- **Prompt usado:** "Tengo este schema de Prisma [pegué el schema]. Al intentar borrar un usuario me da un error de 'Foreign key constraint failed'. ¿Cómo configuro Prisma para que si borro un usuario, se borren automáticamente los hoteles y reservas que ha creado?"
- **Qué obtuvo:** Me indicó que tenía que usar `onDelete: Cascade` en las relaciones `@relation` dentro del modelo. Me dio el código exacto de dónde colocarlo en las relaciones del User y del Hotel.
- **Qué modificó o descartó:** El código que me dio era correcto, pero tuve que acordarme yo de ejecutar `npx prisma migrate dev` después de hacer el cambio para que se aplicara en la base de datos de PostgreSQL, algo que la IA olvidó recordarme.
- **Tiempo con IA:** 10 min | **Tiempo sin IA (estimado):** 45 min
- **Aprendizaje:** Entendí cómo funcionan las reglas `onDelete` en Prisma y cómo se traducen directamente a las constraints de la base de datos relacional.

---

## 2026-05-15 — Lógica de solapamiento de fechas (Overbooking) en Prisma

- **Herramienta:** Gemini 3.1 Pro
- **Contexto:** Necesitaba comprobar si una habitación ya estaba ocupada antes de crear una reserva. Buscar coincidencias de fechas exactas no servía porque las reservas pueden cruzarse de múltiples formas.
- **Prompt usado:** "¿Cómo puedo hacer una consulta en Prisma para saber si una habitación está libre entre dos fechas? Necesito evitar el overbooking."
- **Qué obtuvo:** Me enseñó la fórmula matemática estándar para solapamientos: buscar reservas donde el `checkIn` existente sea menor que el `checkOut` nuevo (`lt`), Y el `checkOut` existente sea mayor que el `checkIn` nuevo (`gt`).
- **Qué modificó o descartó:** Integré directamente estos operadores (`lt` y `gt`) en el bloque `where` de `prisma.booking.findFirst` dentro de `booking.controller.js`.
- **Tiempo con IA:** 15 min | **Tiempo sin IA (estimado):** 2 horas (intentando mapear todos los casos posibles con múltiples if/else en JavaScript).
- **Aprendizaje:** Aprendí que el cruce de intervalos de tiempo se puede resolver con una única condición matemática directamente en la consulta a la base de datos, siendo muchísimo más eficiente que traer todas las reservas a JS y filtrarlas manualmente.

---

## 2026-05-15 — Validación cruzada de fechas con Zod

- **Herramienta:** Gemini 3.1 Pro
- **Contexto:** Estaba creando el esquema de validación para las reservas con Zod. Podía validar que `checkIn` y `checkOut` fueran fechas válidas, pero necesitaba asegurar que el `checkOut` fuera siempre posterior al `checkIn`.
- **Prompt usado:** "Estoy usando Zod para validar un req.body en Express. Tengo 'checkIn' y 'checkOut'. ¿Cómo puedo hacer una validación para obligar a que la fecha de checkOut sea mayor (después) que la de checkIn?"
- **Qué obtuvo:** Me explicó cómo usar el método `.refine()` de Zod aplicándolo a todo el objeto, ya que las validaciones de campos individuales no tienen acceso a los otros campos.
- **Qué modificó o descartó:** El ejemplo que me dio usaba `.superRefine`, que me pareció más complicado de leer. Le pedí una versión más sencilla y me dio la versión con `.refine()`, que es la que finalmente implementé en `booking.schema.js`.
- **Tiempo con IA:** 15 min | **Tiempo sin IA (estimado):** 60 min (leyendo la doc de Zod)
- **Aprendizaje:** Aprendí que `.refine()` a nivel de objeto es la herramienta adecuada para validaciones que dependen de múltiples propiedades del mismo objeto.

---

## 2026-05-16 — Tests secuenciales en Vitest con Base de Datos

- **Herramienta:** Gemini 3.1 Pro
- **Contexto:** Había escrito 10 tests de integración con Vitest y Supertest. Al correrlos uno por uno funcionaban, pero al correr `npm test` fallaban varios porque un test borraba la base de datos (`cleanDatabase`) mientras otro test la estaba leyendo.
- **Prompt usado:** "Mis tests de Vitest fallan porque interactúan con la misma base de datos de Prisma y parece que se ejecutan en paralelo. En mi vitest.config.js he puesto 'sequence: { concurrent: false }' pero siguen fallando. ¿Cómo obligo a Vitest a ejecutar los archivos de test uno por uno de forma totalmente secuencial?"
- **Qué obtuvo:** Me aclaró que `concurrent: false` solo aplica a los tests dentro de un mismo archivo, no a los diferentes archivos. Me dio la configuración correcta: usar `fileParallelism: false`.
- **Qué modificó o descartó:** Apliqué directamente su sugerencia al `vitest.config.js` y el problema se solucionó inmediatamente.
- **Tiempo con IA:** 5 min | **Tiempo sin IA (estimado):** 30 min (buscando en internet y la doc de Vitest)
- **Aprendizaje:** Entendí la diferencia entre paralelismo de tests (dentro del mismo archivo) y paralelismo de archivos en los test runners modernos como Vitest.
