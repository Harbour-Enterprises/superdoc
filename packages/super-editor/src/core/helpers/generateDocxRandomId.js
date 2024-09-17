/**
 * Generate a string ID following docx ID format (see: paraId, rsidR etc.)
 * @returns {string} - 8 character random string
 */
export function generateDocxRandomId() {
  const characters = '0123456789abcdef';

  let id = [];
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id.push(characters[randomIndex]);
  }
  
  return id.join('');
}
