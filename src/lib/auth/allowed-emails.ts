export function getAllowedEmails(value = process.env.AUTH_ALLOWED_EMAILS) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLocaleLowerCase("en-US"))
      .filter(Boolean),
  );
}

export function isEmailAllowed(email: string | null | undefined) {
  return Boolean(email && getAllowedEmails().has(email.toLocaleLowerCase("en-US")));
}
