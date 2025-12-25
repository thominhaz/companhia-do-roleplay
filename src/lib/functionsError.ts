export async function getFunctionsErrorMessage(error: unknown, response?: Response): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Erro inesperado";

  if (!response) return fallback;

  const status = response.status;

  // Auth/session issues
  if (status === 401) {
    return "Sua sessão expirou. Faça login novamente e tente de novo.";
  }

  // Try to extract a more specific message from the function response
  try {
    const contentType = response.headers.get("Content-Type") ?? "";
    const cloned = response.clone();

    if (contentType.includes("application/json")) {
      const json = (await cloned.json()) as any;
      const msg = (json?.error || json?.message || json?.msg) as string | undefined;
      if (msg && typeof msg === "string" && msg.trim()) return msg;
    } else {
      const text = await cloned.text();
      if (text && text.trim()) {
        // Common Discord permission error surfaced by backend
        if (text.includes("Missing Permissions") || text.includes("50013")) {
          return "O bot do Discord está sem permissão para gerenciar cargos. Garanta que ele tenha 'Gerenciar Cargos' e esteja acima dos cargos Aldeão/Herói/Mestre na hierarquia.";
        }
        return text;
      }
    }
  } catch {
    // ignore parsing errors
  }

  // Generic server/unavailable
  if (status === 404) {
    return "Serviço temporariamente indisponível. Tente novamente em alguns segundos.";
  }

  return fallback;
}
