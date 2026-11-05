// Lista de atalhos de apps (Waze, Spotify…).
//
// A lista mora num lugar só: nas opções do plugin withCarLauncher no app.json.
// O plugin repassa a lista para `extra.carApps`, e aqui validamos o formato
// antes de usar (um erro de digitação no app.json não pode derrubar o app).

export type CarApp = {
  /** Nome curto que aparece embaixo do ícone. */
  label: string;
  /** Pacote Android do app, ex.: "com.waze". */
  package: string;
};

const PACKAGE_RE = /^[A-Za-z][\w]*(\.[A-Za-z_][\w]*)+$/;

/** Confere se o texto parece um nome de pacote Android válido. */
export const isValidPackageName = (name: string) => PACKAGE_RE.test(name);

/** Converte o valor bruto do app.json numa lista segura (itens inválidos e repetidos saem). */
export function parseCarApps(raw: unknown): CarApp[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const apps: CarApp[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { label, package: pkg } = item as Record<string, unknown>;
    if (typeof pkg !== 'string' || !isValidPackageName(pkg) || seen.has(pkg)) continue;
    seen.add(pkg);
    apps.push({ label: typeof label === 'string' && label.trim() ? label.trim() : pkg, package: pkg });
  }
  return apps;
}
