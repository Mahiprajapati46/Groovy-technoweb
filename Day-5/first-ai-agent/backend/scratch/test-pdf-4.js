const pdf = require('pdf-parse');
console.log('Keys of PDFParse:', Object.keys(pdf.PDFParse));
for (const key of Object.keys(pdf.PDFParse)) {
    console.log(`Type of PDFParse.${key}:`, typeof pdf.PDFParse[key]);
}
