
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function askGemini(message, menu, addableItems) {
  const prompt = `
You are a friendly personal assistant for a bubble tea shop.

Help customers:
- Understand the menu
- Learn about drink ingredients
- Find available customizations
- Get drink recommendations
- Decide what they would like to order

CURRENT MENU:
${JSON.stringify(menu, null, 2)}

AVAILABLE ADD-ONS:
${JSON.stringify(addableItems, null, 2)}

IMPORTANT RULES:
- Only recommend drinks that exist in the menu.
- Only state prices provided in the menu.
- Do not invent ingredients or customization options.
- If you don't know something, say so.
- Be friendly, concise, and helpful.
- Do not claim to have placed an order.

CUSTOMER MESSAGE:
${message}
`;

  const interaction = await ai.interactions.create({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    input: prompt
  });

  return interaction.output_text;
}

module.exports = { askGemini };