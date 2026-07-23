// import the normalize function from the utils/normalize.js file
const normalize = require("../utils/normalize");
//import the englishWords and nepaliWords arrays from the utils/profanityWords.js file
const {
    englishWords,
    nepaliWords
} = require("../utils/profanityWords");

const allWords = [
    ...englishWords,
    ...nepaliWords
];

// This function checks if the given text contains any profane words
function containsProfanity(text) {
    const normalized = normalize(text);
    const words = normalized.split(" ");
    const found = [];
    for (const word of words) {
        if (allWords.includes(word)) {
            found.push(word);
        }
    }
    return {
        hasProfanity: found.length > 0,
        matchedWords: found
    };
}

// This middleware function checks for profanity in the request body fields
module.exports = (req, res, next) => {
    const fields = [
        "title",
        "content",
        "description",
        "message"
    ];
    const results = [];
    for (const field of fields) {
        if (!req.body[field]) continue;
        const result = containsProfanity(req.body[field]);
        if (result.hasProfanity) {
            results.push({
                field,
                words: result.matchedWords
            });
        }
    }
    req.profanity = {
        hasProfanity: results.length > 0,
        matches: results
    };
    next();
};