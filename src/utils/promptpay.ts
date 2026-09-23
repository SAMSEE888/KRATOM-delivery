/**
 * Helper utility to generate PromptPay EMVCo QR Code Payload with CRC16 Checksum
 * Standard for Bank Applications in Thailand (KBANK, SCB, Krungthai, Bangkok Bank, PromptPay)
 */

function crc16CCITT(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function formatPhoneNumber(phone: string): string {
  // Clean non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '0066' + digits.substring(1);
  }
  if (digits.startsWith('66')) {
    return '00' + digits;
  }
  return digits;
}

export function generatePromptPayPayload(targetPhoneOrId: string, amount?: number): string {
  const formattedTarget = formatPhoneNumber(targetPhoneOrId);
  
  // Tag 00: Payload Format Indicator
  let payload = '000201';
  
  // Tag 01: Point of Initiation Method (12 for Dynamic with Amount, 11 for Static)
  payload += amount && amount > 0 ? '010212' : '010211';
  
  // Tag 29: Merchant Account Information - PromptPay
  // Sub-tag 00: AID (A000000677010111)
  // Sub-tag 01: Phone number formatted with length
  const subTag00 = '0016A000000677010111';
  const subTag01Value = formattedTarget;
  const subTag01Length = subTag01Value.length.toString().padStart(2, '0');
  const subTag01 = `01${subTag01Length}${subTag01Value}`;
  
  const tag29Value = `${subTag00}${subTag01}`;
  const tag29Length = tag29Value.length.toString().padStart(2, '0');
  payload += `29${tag29Length}${tag29Value}`;
  
  // Tag 53: Transaction Currency (764 = THB)
  payload += '5303764';
  
  // Tag 54: Transaction Amount
  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2);
    const amountLength = amountStr.length.toString().padStart(2, '0');
    payload += `54${amountLength}${amountStr}`;
  }
  
  // Tag 58: Country Code (TH)
  payload += '5802TH';
  
  // Tag 63: CRC16 Placeholder
  payload += '6304';
  
  // Calculate CRC16
  const checksum = crc16CCITT(payload);
  
  return payload + checksum;
}
