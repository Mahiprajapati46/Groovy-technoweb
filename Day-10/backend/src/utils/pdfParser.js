import pdfParse from 'pdf-parse';

// Parse PDF and extract text with page tracking
export async function parsePDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    // Extract text with page information
    const pages = [];
    let pageNum = 1;
    
    // pdf-parse gives us text, we need to split by pages
    // Each page typically separated by form feed or we use page array if available
    if (data.text) {
      // Split by common page separators
      const pageTexts = data.text.split(/\f/);
      
      pageTexts.forEach((pageText, index) => {
        if (pageText.trim()) {
          pages.push({
            pageNumber: index + 1,
            text: pageText.trim(),
            wordCount: pageText.trim().split(/\s+/).length
          });
        }
      });
    }
    
    return {
      success: true,
      totalPages: data.numpages || pages.length,
      pages: pages,
      fullText: data.text,
      metadata: {
        producer: data.info?.Producer || 'Unknown',
        creator: data.info?.Creator || 'Unknown',
        title: data.info?.Title || 'Unknown'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Format pages with context for Groq query
export function formatContextForQuery(pages, query) {
  const formattedPages = pages.map(page => 
    `[Page ${page.pageNumber}]:\n${page.text}`
  ).join('\n\n---\n\n');
  
  return formattedPages;
}
