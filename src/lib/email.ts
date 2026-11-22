/**
 * Company email convention: FirstNameLastName@elam.com
 * Pure helper shared by the UI (auto-fill) and the API (fallback).
 */
export const COMPANY_DOMAIN = 'elam.com';

export function emailFromName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return `${parts.join('')}@${COMPANY_DOMAIN}`;
}
