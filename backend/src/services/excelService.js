import XLSX from 'xlsx';

/**
 * Generate an Excel file buffer from JSON data
 * @param {Array<Object>} jsonData - The array of objects to write to Excel
 * @param {string} sheetName - Custom name for the sheet tab (max 31 chars)
 * @returns {Buffer} - Excel file buffer
 */
export const generateExcelBuffer = (jsonData, sheetName = 'Sheet1') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  } catch (error) {
    console.error('❌ Failed to generate Excel buffer:', error.message);
    throw error;
  }
};
