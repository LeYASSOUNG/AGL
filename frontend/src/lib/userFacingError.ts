export function toUserFacingErrorMessage(err: unknown): string {
  const raw =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : '';

  const msg = (raw || '').trim();
  if (!msg) return "Une erreur est survenue. Veuillez réessayer.";

  // Network / fetch
  if (
    /Failed to fetch/i.test(msg) ||
    /NetworkError/i.test(msg) ||
    /ECONNREFUSED/i.test(msg) ||
    /ERR_NETWORK/i.test(msg)
  ) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.";
  }

  // Generic HTTP messages
  if (/^HTTP\s+\d{3}\b/i.test(msg) || /\bHTTP\s+\d{3}\b/i.test(msg)) {
    return "Une erreur est survenue. Veuillez réessayer dans quelques instants.";
  }

  // Avoid exposing technical guidance/logs
  if (/backend|proxy|vite|mvn|java\.exe|sql|stack|exception|port\s*\d+/i.test(msg)) {
    return "Une erreur est survenue. Veuillez réessayer.";
  }

  // Otherwise keep the (already user-friendly) message.
  return msg;
}

