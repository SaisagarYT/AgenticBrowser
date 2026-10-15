"use strict";

import { browserManager } from "../core/browserManager.js";

export async function getUrl() {
  const page = await browserManager.getPage();
  return {
    url: page.url(),
    title: await page.title(),
  };
}
