import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of payment validation logic directly in mjs
function luhnCheck(cleanNumber) {
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

function validateCard(card) {
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

test('rejects empty card details', () => {
  const result = validateCard({ number: '', name: '', expiry: '', cvv: '' });
  assert.equal(result.valid, false);
  assert.match(result.error, /Please enter your card number/);
});

test('rejects invalid length or format card numbers', () => {
  const result = validateCard({ number: '1234', name: 'John Doe', expiry: '12/28', cvv: '123' });
  assert.equal(result.valid, false);
  assert.match(result.error, /15 or 16 digits/);
});

test('rejects card numbers that fail Luhn checksum', () => {
  const result = validateCard({
    number: '4111 1111 1111 1112',
    name: 'John Doe',
    expiry: '12/28',
    cvv: '123',
  });
  assert.equal(result.valid, false);
  assert.match(result.error, /checksum verification failed/);
});

test('rejects expired cards', () => {
  const result = validateCard({
    number: '4000 0000 0000 0002', // Valid Luhn
    name: 'John Doe',
    expiry: '01/20', // Expired
    cvv: '123',
  });
  assert.equal(result.valid, false);
  assert.match(result.error, /expired/);
});

test('rejects invalid CVV', () => {
  const result = validateCard({
    number: '4000 0000 0000 0002',
    name: 'John Doe',
    expiry: '12/28',
    cvv: '1',
  });
  assert.equal(result.valid, false);
  assert.match(result.error, /CVV/);
});

test('accepts valid card credentials', () => {
  const result = validateCard({
    number: '4000 0000 0000 0002',
    name: 'Akash Induwara',
    expiry: '12/28',
    cvv: '123',
  });
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});
