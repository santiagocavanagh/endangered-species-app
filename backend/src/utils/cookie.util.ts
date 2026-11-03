// Parser manual de la cabecera Cookie: evita sumar la dependencia "cookie-parser"
// solo para leer un único valor en el middleware de autenticación.
export function parseCookies(
  header: string | undefined,
): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!header) {
    return cookies;
  }

  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;

    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();

    if (!key) continue;

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }

  return cookies;
}
