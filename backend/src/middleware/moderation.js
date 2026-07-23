const client = require('../config/openai');

//
async function moderateText(text) {
    try {
        const response = await client.moderations.create({
            model: 'omni-moderation-latest',
            input: text,
        });
        console.log("succesfully moderated through open AI");
        const result = response.results[0];
        console.log(result);
        return {
            success: true,
            flagged: result.flagged,
            categories: result.categories,
            categoryScores: result.category_scores,
            
        };
    } catch (error) {
        console.error('OpenAI Moderation Error:', error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}


module.exports = async (req, res, next) => {
    try {
        // Collect all text fields
        const MODERATED_FIELDS = ['title', 'content', 'description', 'message'];

        const textParts = [];

        for (const field of MODERATED_FIELDS) {
            if (req.body[field]) {
                textParts.push(req.body[field]);
            }
        }
        
        // Combine all text parts to moderate using single api call
        const combinedText = textParts.join('\n\n');

        // If no text exists, skip moderation
        if (!combinedText.trim()) {
            req.aiModeration = {
                success: true,
                flagged: false,
                categories: {},
                categoryScores: {},
            };

            return next();
        }

        // Send to OpenAI
        const result = await moderateText(combinedText);
        req.aiModeration = result;

        next();
    } catch (error) {
        next(error);
    }
};