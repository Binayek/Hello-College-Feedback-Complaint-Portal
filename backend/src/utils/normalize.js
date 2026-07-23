// Normalizes text by converting to lowercase and replacing common symbols for profane woords
function normalize(text) {

    return text
        .toLowerCase()

        // replace common symbols
        .replace(/[@]/g, "a")
        .replace(/[4]/g, "a")

        .replace(/[3]/g, "e")

        .replace(/[1!]/g, "i")

        .replace(/[0]/g, "o")

        .replace(/[$]/g, "s")

        .replace(/[5]/g, "s")

        // remove punctuation
        .replace(/[^a-z0-9\s]/g, "")

        // remove extra spaces
        .replace(/\s+/g, " ")

        .trim();
}

module.exports = normalize;