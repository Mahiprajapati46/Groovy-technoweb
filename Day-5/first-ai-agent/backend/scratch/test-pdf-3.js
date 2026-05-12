const pdf = require('pdf-parse');
try {
    console.log('Attempting to instantiate PDFParse...');
    const instance = new pdf.PDFParse();
    console.log('Keys of instance:', Object.keys(instance));
} catch (e) {
    console.log('Error instantiating:', e.message);
}
