// Validadores reutilizables para formularios del cliente.
// Cada función devuelve un mensaje de error (string) o "" si el valor es válido.

export const validateName = (value) => {
  if (!value || !value.trim()) return "El nombre es obligatorio.";
  if (value.trim().length < 2) return "Debe tener al menos 2 caracteres.";
  return "";
};

export const validateEmail = (value) => {
  if (!value || !value.trim()) return "El email es obligatorio.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value.trim()) ? "" : "Introduce un email válido.";
};

// Contraseña fuerte (registro): espejo de las reglas del backend.
export const validatePassword = (value) => {
  if (!value) return "La contraseña es obligatoria.";
  if (value.length < 8) return "Mínimo 8 caracteres.";
  if (!/[A-Z]/.test(value)) return "Debe incluir al menos una mayúscula.";
  if (!/[0-9]/.test(value)) return "Debe incluir al menos un número.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Debe incluir al menos un símbolo.";
  return "";
};

// Contraseña solo requerida (login): el usuario ya existe, no validamos fuerza.
export const validateRequiredPassword = (value) =>
  value ? "" : "La contraseña es obligatoria.";

// Valida un objeto de campos con su mapa de validadores.
// Devuelve { errors, isValid }.
export const validateForm = (values, rules) => {
  const errors = {};
  for (const field in rules) {
    const message = rules[field](values[field]);
    if (message) errors[field] = message;
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
};
