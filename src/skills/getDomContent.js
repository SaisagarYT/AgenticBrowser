"use strict";

import { browserManager } from "../core/browserManager.js";
import { extractDomRepresentation } from "../utils/domHelper.js";

export async function getDomContent({ contentType = "fields" } = {}) {
  const page = await browserManager.getPage();
  const domData = await extractDomRepresentation(page, contentType);

  return {
    contentType,
    data: domData,
  };
}
