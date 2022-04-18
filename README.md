# deepl-parse-html

Node.js tool to translate html documents using the DeepL API. Requires a DeepL API key. Directly separates markup and text and keeps formatting on output.

## Installation and Usage

**Installation:**

-   Fork or clone the repository onto your local machine
-   Run `npm install`

**Usage**

-   Copy the original (untranslated) HTML-file into the `src` folder.
-   Configure the script by updating the local constants in `translate.js` (line 5-13).
-   Run `node translate.js`
-   The translated HTML-file can be found in the destinated `bin` folder.
