/**
 * Countries a tutor can live in (ISO 3166 codes). Names are not stored: the site shows each code
 * in the interface language with Intl.DisplayNames.
 */
export const COUNTRY_CODES = [
  'IL', 'RU', 'UA', 'BY', 'KZ', 'UZ', 'KG', 'GE', 'AM', 'AZ', 'MD', 'GR', 'CY', 'TR', 'DE', 'AT', 'CH', 'FR', 'BE', 'NL',
  'IT', 'ES', 'PT', 'GB', 'IE', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'RS', 'LV', 'LT', 'EE', 'FI', 'SE', 'NO', 'DK', 'US',
  'CA', 'MX', 'BR', 'AR', 'AU', 'NZ', 'JP', 'CN', 'KR', 'IN', 'TH', 'AE', 'ZA',
] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];
