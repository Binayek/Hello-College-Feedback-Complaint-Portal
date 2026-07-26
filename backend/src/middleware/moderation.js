const ai = require("../config/gemini");

async function moderateText(text) {
    try {

        const prompt = `You are a content moderation system.

Classify the following text.

Reject ONLY if it contains:
- harassment
- hate speech
- threats
- obscene abuse

If the text is reporting abuse instead of committing abuse, return SAFE.

Text:
"""
${text}
"""`;

const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,

    config: {
        responseMimeType: "application/json",

        responseSchema: {
            type: "OBJECT",

            properties: {

                decision: {
                    type: "STRING",
                    enum: ["SAFE", "REJECT"]
                },

                reason: {
                    type: "STRING"
                },

                confidence: {
                    type: "NUMBER"
                },

                categories: {
                    type: "OBJECT",

                    properties: {

                        harassment: {
                            type: "BOOLEAN"
                        },

                        hate: {
                            type: "BOOLEAN"
                        },

                        sexual: {
                            type: "BOOLEAN"
                        },

                        violence: {
                            type: "BOOLEAN"
                        }

                    },

                    required: [
                        "harassment",
                        "hate",
                        "sexual",
                        "violence"
                    ]
                }

            },

            required: [
                "decision",
                "reason",
                "confidence",
                "categories"
            ]
        }
    }
});
        console.log("Successfully moderated through Gemini");

        // Gemini returns text
        const json = response.text.trim();

        const result = JSON.parse(response.text);

        console.log(result);

        return {
            success: true,
            flagged: result.decision === "REJECT",
            decision: result.decision,
            reason: result.reason,
            confidence: result.confidence,
            categories: result.categories,
        };

    } catch (error) {

        console.error("Gemini Moderation Error:", error);

        return {
            success: false,
            error: error.message,
        };

    }
}

module.exports = async (req, res, next) => {

    try {
        // all fields that you get from req
        const MODERATED_FIELDS = [
            "title",
            "content",
            "description",
            "message",
        ];

        const textParts = [];
        // add all text in single variable. Allow a message to be moderated using single API call
        for (const field of MODERATED_FIELDS) {
            if (req.body[field]) {
                textParts.push(req.body[field]);
            }
        }

        const combinedText = textParts.join("\n\n");

        //checks if combined text is null
        if (!combinedText.trim()) {

            req.aiModeration = {
                success: true,
                flagged: false,
                decision: "SAFE",
                reason: "",
                confidence: 1,
                categories: {},
            };

            return next();

        }

        const result = await moderateText(combinedText);

        req.aiModeration = result;

        next();

    } catch (error) {

        next(error);

    }

};