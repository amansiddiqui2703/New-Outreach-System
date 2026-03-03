import env from '../config/env.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const callGemini = async (prompt) => {
    if (!env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export const generateColdEmail = async ({ purpose, recipientInfo, tone, senderInfo }) => {
    const prompt = `Write a professional cold outreach email.
Purpose: ${purpose}
Recipient info: ${recipientInfo || 'Unknown'}
Tone: ${tone || 'professional'}
Sender info: ${senderInfo || 'Not provided'}

Write ONLY the email body (no subject line). Use a compelling opening, clear value proposition, and a call to action. Keep it concise (under 200 words).`;
    return callGemini(prompt);
};

export const rewriteEmail = async ({ content, instructions }) => {
    const prompt = `Rewrite the following email. ${instructions || 'Improve clarity and impact.'}

Original email:
${content}

Provide ONLY the rewritten email body.`;
    return callGemini(prompt);
};

export const improveTone = async ({ content, tone }) => {
    const prompt = `Rewrite this email in a ${tone} tone. Keep the same message but adjust the writing style.

Original:
${content}

Provide ONLY the rewritten email.`;
    return callGemini(prompt);
};

export const generateSubjectLines = async ({ content, count }) => {
    const prompt = `Generate ${count || 5} compelling email subject lines for this email. The subject lines should maximize open rates while being honest and not spam-like.

Email content:
${content}

Return ONLY a numbered list of subject lines.`;
    return callGemini(prompt);
};

export const personalizeEmail = async ({ template, recipientData }) => {
    const prompt = `Personalize this email template for the specific recipient. Add natural personalization touchpoints based on the recipient data.

Template:
${template}

Recipient data:
${JSON.stringify(recipientData)}

Provide ONLY the personalized email body.`;
    return callGemini(prompt);
};

export const generateFollowUp = async ({ originalEmail, followUpNumber, context }) => {
    const prompt = `Write follow-up email #${followUpNumber || 1} for the email below. ${context || ''}

The follow-up should:
- Reference the original email naturally
- Add new value or angle
- Be shorter than the original
- Have a clear CTA

Original email:
${originalEmail}

Provide ONLY the follow-up email body.`;
    return callGemini(prompt);
};

export const spamScoreCheck = async ({ subject, content }) => {
    const prompt = `Analyze this email for spam risk. Score from 0-10 (0 = safe, 10 = definitely spam). List specific issues and suggestions.

Subject: ${subject}
Body:
${content}

Format your response as:
SCORE: [number]
ISSUES:
- [issue 1]
- [issue 2]
SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]`;
    return callGemini(prompt);
};
