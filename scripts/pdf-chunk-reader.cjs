const fs = require('fs');
const path = require('path');

const PDF_PATH = path.join(__dirname, '..', 'grammar_guide.pdf');
const OUTPUT_DIR = path.join(__dirname, '..', 'pdf-chunks');
const CHUNK_SIZE = 3000; // characters per chunk

async function readPdfInChunks() {
  console.log('Reading PDF:', PDF_PATH);

  // Dynamic import for pdf-parse
  const pdfParse = (await import('pdf-parse')).default;

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdfParse(dataBuffer);

    console.log(`\n=== PDF METADATA ===`);
    console.log(`Total Pages: ${data.numpages}`);
    console.log(`Total Characters: ${data.text.length}`);

    const text = data.text;
    const chunks = [];

    // Split into chunks
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Total Chunks: ${chunks.length}`);
    console.log(`\n=== SAVING CHUNKS ===`);

    // Save each chunk to a file
    chunks.forEach((chunk, index) => {
      const chunkPath = path.join(OUTPUT_DIR, `chunk_${String(index + 1).padStart(3, '0')}.txt`);
      fs.writeFileSync(chunkPath, chunk);
      console.log(`Saved: chunk_${String(index + 1).padStart(3, '0')}.txt (${chunk.length} chars)`);
    });

    // Save metadata
    const metadata = {
      totalPages: data.numpages,
      totalCharacters: text.length,
      totalChunks: chunks.length,
      chunkSize: CHUNK_SIZE,
      pdfInfo: data.info,
      processedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`\nMetadata saved to metadata.json`);
    console.log(`\nAll chunks saved to: ${OUTPUT_DIR}`);

    return { chunks, metadata };
  } catch (error) {
    console.error('Error reading PDF:', error.message);
    process.exit(1);
  }
}

readPdfInChunks();
