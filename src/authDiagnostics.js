export function logAuthDiagnostic(action, details = {}) {
  if (!import.meta.env.DEV) return;
  console.info(`[A-Level Dojo auth] ${action}`, details);
}
