import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_PATH = path.join(__dirname, '..', 'grammar_guide.pdf');
const OUTPUT_DIR = path.join(__dirname, '..', 'pdf-chunks');
const CHUNK_SIZE = 3000; // characters per chunk

async function extractTextFromPDF(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  let fullText = '';
  const pageTexts = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    pageTexts.push({ page: i, text: pageText });
    fullText += pageText + '\n\n';
  }

  return { fullText, pageTexts, numPages: doc.numPages };
}

async function readPdfInChunks() {
  console.log('Reading PDF:', PDF_PATH);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    const { fullText, pageTexts, numPages } = await extractTextFromPDF(PDF_PATH);

    console.log(`\n=== PDF METADATA ===`);
    console.log(`Total Pages: ${numPages}`);
    console.log(`Total Characters: ${fullText.length}`);

    const chunks = [];

    // Split into chunks
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
      chunks.push(fullText.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Total Chunks: ${chunks.length}`);
    console.log(`\n=== SAVING CHUNKS ===`);

    // Save each chunk to a file
    chunks.forEach((chunk, index) => {
      const chunkPath = path.join(OUTPUT_DIR, `chunk_${String(index + 1).padStart(3, '0')}.txt`);
      fs.writeFileSync(chunkPath, chunk);
      console.log(`Saved: chunk_${String(index + 1).padStart(3, '0')}.txt (${chunk.length} chars)`);
    });

    // Save page-by-page text
    pageTexts.forEach((pt) => {
      const pagePath = path.join(OUTPUT_DIR, `page_${String(pt.page).padStart(3, '0')}.txt`);
      fs.writeFileSync(pagePath, pt.text);
    });
    console.log(`Saved ${pageTexts.length} individual page files`);

    // Save metadata
    const metadata = {
      totalPages: numPages,
      totalCharacters: fullText.length,
      totalChunks: chunks.length,
      chunkSize: CHUNK_SIZE,
      processedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Save full text
    fs.writeFileSync(path.join(OUTPUT_DIR, 'full_text.txt'), fullText);

    console.log(`\nMetadata saved to metadata.json`);
    console.log(`Full text saved to full_text.txt`);
    console.log(`\nAll files saved to: ${OUTPUT_DIR}`);

    return { chunks, metadata };
  } catch (error) {
    console.error('Error reading PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

readPdfInChunks();
