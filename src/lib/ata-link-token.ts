export const ATA_LINK_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function isSecureAtaLinkToken(value: string) {
  return ATA_LINK_TOKEN_PATTERN.test(value);
}
