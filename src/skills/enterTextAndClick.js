"use strict";

import { enterText } from "./enterText.js";
import { clickSelector } from "./clickSelector.js";

export async function enterTextAndClick({ inputSelector, text, clickSelector: submitSelector }) {
  const enterResult = await enterText({ selector: inputSelector, text });
  const clickResult = await clickSelector({ selector: submitSelector });

  return {
    success: true,
    message: `Entered text and clicked submit`,
    details: { enterResult, clickResult },
  };
}
