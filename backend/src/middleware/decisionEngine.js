module.exports = (req, res, next) => {
    const profanity = req.profanity;
    const ai = req.aiModeration;

    let decision = "SAFE";
    let reasons = [];

    // Local profanity filter
    if (profanity?.hasProfanity) {
        decision = "REJECT";
        reasons.push({
            type: "PROFANITY",
            words: profanity.matches
        });
    }

    // gemini moderation
    if (ai?.flagged) {
        decision = "REJECT";
        reasons.push({
            type: "AI_MODERATION",
            categories: ai.categories
        });
    }

    // add the moderation result to the request object
    req.moderation = {
        decision,
        reasons
    };

    // If the decision is to reject, send a 403 response with details
    if (decision === "REJECT") {
    const response = {
        success: false,
        message: "Your submission contains inappropriate content."
    };
    // Local profanity
    if (profanity?.hasProfanity) {
        response.blockedWords = profanity.matches;
    }
    // AI moderation
    if (ai?.flagged) {
        response.reason =
            "Your submission was flagged by our content moderation system.";
    }
    return res.status(403).json(response);
}

    next();

};