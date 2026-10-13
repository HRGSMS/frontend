export interface CardFormDetails {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export function getCardBrand(num: string): 'Visa' | 'Mastercard' | 'Amex' | 'Card' {
  const clean = num.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
  if (/^3[47]/.test(clean)) return 'Amex';
  return 'Card';
}

export function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 16);
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

export function formatExpiry(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return clean;
}

export function luhnCheck(cleanNumber: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function validateCard(card: CardFormDetails): { valid: boolean; error?: string } {
  const cleanNumber = card.number.replace(/\D/g, '');
  if (!cleanNumber) {
    return { valid: false, error: 'Please enter your card number' };
  }
  if (cleanNumber.length < 15 || cleanNumber.length > 16) {
    return { valid: false, error: 'Card number must be 15 or 16 digits' };
  }
  if (!luhnCheck(cleanNumber)) {
    return {
      valid: false,
      error: 'Invalid card number (checksum verification failed). Please re-check the digits.',
    };
  }

  const cleanName = card.name.trim();
  if (!cleanName || cleanName.length < 3) {
    return { valid: false, error: 'Please enter the cardholder name as printed on the card' };
  }

  const cleanExpiry = card.expiry.trim();
  if (!/^\d{2}\/\d{2}$/.test(cleanExpiry)) {
    return { valid: false, error: 'Please enter a valid expiry date in MM/YY format' };
  }
  const [mmStr, yyStr] = cleanExpiry.split('/');
  const mm = parseInt(mmStr, 10);
  const yy = parseInt(yyStr, 10) + 2000;
  if (mm < 1 || mm > 12) {
    return { valid: false, error: 'Expiry month must be between 01 and 12' };
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
    return { valid: false, error: 'This card has expired. Please provide an active card.' };
  }

  const cleanCvv = card.cvv.trim();
  if (!/^\d{3,4}$/.test(cleanCvv)) {
    return { valid: false, error: 'Please enter a valid 3 or 4 digit CVV / CVC code' };
  }

  return { valid: true };
}
