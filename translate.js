import fs from "file-system";
import read from "read-file";
import fetch from "node-fetch";

// DeepL-API configuration
const DEEPL_API = "https://api-free.deepl.com/v2/translate";
const DEEPL_AUTH_KEY = "3b666c65-7e35-93bd-898a-54ee2735aca6:fx";
const SOURCE_LANG = "DE";
const TARGET_LANG = "EN";

// Files configuration
const SOURCE_FILE = "src/original.html";
const TARGET_FILE = "bin/translated.html";

const split = (str, index) => {
	return [str.slice(0, index), str.slice(index)];
};

const getHTMLPlaintextSplitIndices = (text) => {
	let regex = />(?!(\s+|<|$))/g,
		localities = [],
		find = null;

	while ((find = regex.exec(text)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if (find.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		localities.push(find.index);
	}
	return localities;
};

const splitHTMLPlaintext = (text, localities) => {
	let fractions = [],
		offset = 0;

	localities.forEach((index) => {
		const [_, temp] = split(text, offset);
		const [markup, rest] = split(temp, index + 1 - offset);
		const [words, __] = split(rest, rest.indexOf("<"));
		fractions.push(markup, words);

		offset = index + words.length + 1;
	});
	fractions.push(String(text).slice(offset));

	return fractions;
};

const translatePhrase = async (phrase) => {
	return await fetch(
		`${DEEPL_API}?auth_key=${DEEPL_AUTH_KEY}&source_lang=${SOURCE_LANG}&target_lang=${TARGET_LANG}&text=${phrase}`,
		{
			method: "POST",
			body: JSON.stringify({
				auth_key: DEEPL_AUTH_KEY,
				text: phrase,
				source_lang: SOURCE_LANG,
				target_lang: TARGET_LANG,
			}),
			headers: {
				"Content-type": "application/x-www-form-urlencoded",
				"Content-Length": phrase.length,
				Accept: "*/*",
				"User-Agent": "YourApp",
			},
		}
	)
		.then((response) => response.json())
		.then((json) => {
			return json.translations[0].text;
		})
		.catch((error) => {
			console.log(error);
			throw new Error();
		});
};

export const translateHTMLAsync = () => {
	read(SOURCE_FILE, "utf8", (error, buffer) => {
		if (error) return;

		const indices = getHTMLPlaintextSplitIndices(buffer);
		const partedPhrasesMarkup = splitHTMLPlaintext(buffer, indices);
		const phrases = partedPhrasesMarkup.filter((_, i) => {
			return i % 2 === 1;
		});

		Promise.all(
			phrases.map((phrase, i) => {
				return new Promise((resolve, reject) => {
					translatePhrase(phrase)
						.then((translation) => {
							resolve(translation);
						})
						.catch((error) => {
							console.log(error);
							reject(
								`Failed translation: phrase #${i} couldn't be translated:\n ${phrase}.`
							);
						});
				});
			})
		).then((translations) => {
			translations.forEach((translation, i) => {
				partedPhrasesMarkup[1 + 2 * i] = translation;
			});
			fs.writeFileSync(TARGET_FILE, partedPhrasesMarkup.join(""));
		});
	});
};

translateHTMLAsync();
