"use strict";

import fs from "node:fs";
import { logger } from "../utils/logger.js";
import { SkillError } from "../utils/errors.js";

export async function extractPdfText({ pdfSource }) {
  if (!pdfSource) throw new SkillError("PDF source URL or filepath is required");

  logger.info(`Extracting text from PDF: ${pdfSource}`);

  try {
    let dataBuffer;
    if (/^https?:\/\//i.test(pdfSource)) {
      const response = await fetch(pdfSource);
      if (!response.ok) throw new Error(`HTTP fetch failed with status ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      dataBuffer = Buffer.from(arrayBuffer);
    } else {
      dataBuffer = fs.readFileSync(pdfSource);
    }

    // Dynamic import for pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(dataBuffer);

    return {
      pages: data.numpages,
      textLength: data.text.length,
      textSnippet: data.text.slice(0, 4000),
      info: data.info,
    };
  } catch (err) {
    throw new SkillError(`Failed to extract text from PDF (${pdfSource}): ${err.message}`);
  }
}
