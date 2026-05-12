const { PDFParse } = require('pdf-parse');
async function test() {
    try {
        const parser = new PDFParse();
        console.log('Parser instance created.');
        console.log('Keys of parser:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
