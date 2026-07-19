export function requestOrigin(headers: Headers) {
  const forwardedHost = headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || headers.get("host") || "";
  if (!host) return "";

  const protocol =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${protocol}://${host}`;
}
