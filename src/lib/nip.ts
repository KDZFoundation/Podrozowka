/**
 * Polish NIP (Tax Identification Number) validator.
 * NIP is 10 digits + checksum on 10th digit.
 * Weights: [6, 5, 7, 2, 3, 4, 5, 6, 7]; sum mod 11 == last digit; result 10 is invalid.
 */
export function normalizeNip(raw: string): string {
  return (raw || "").replace(/[^0-9]/g, "");
}

export function isValidNip(raw: string): boolean {
  const nip = normalizeNip(raw);
  if (nip.length !== 10) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += weights[i] * Number(nip[i]);
  const check = sum % 11;
  if (check === 10) return false;
  return check === Number(nip[9]);
}
