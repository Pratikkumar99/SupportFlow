import { GoogleGenAI } from "@google/genai";
import {
  getOrderStatus,
  getMyOrders,
} from "../tools/order.tools.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const tools = [
  {
    functionDeclarations: [
      {
        name: "getOrderStatus",
        description:
          "Get the status and details of ONE specific order belonging to the authenticated user. Use this only when the user provides an order number.",
        parameters: {
          type: "OBJECT",
          properties: {
            orderNumber: {
              type: "STRING",
              description: "The order number, for example ORD1002.",
            },
          },
          required: ["orderNumber"],
        },
      },

      {
        name: "getMyOrders",
        description:
          "Get ALL orders belonging to the authenticated user. Use this when the user asks for all orders, order history, previous orders, or their orders without specifying one order number.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
];

export async function generateReply(message, userId) {
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",

    contents: message,

    config: {
      systemInstruction: `
You are SupportFlow, an AI customer support assistant.

Your job is ONLY to help users with:
- Orders
- Order status
- Order details
- Payments related to orders
- Shipping and delivery
- Order cancellation
- Order issues
- Customer support questions related to orders

You must NOT answer unrelated questions about:
- Weather
- General knowledge
- Programming
- Mathematics
- Politics
- Entertainment
- Education
- Other unrelated topics

If the user's question is unrelated to orders or customer support, politely say:

"I'm SupportFlow, and I can only help you with orders and customer support."

Do not provide an answer to the unrelated question.
`,
      tools,
    },
  });

  const functionCall = response.functionCalls?.[0];

  // Gemini didn't request a tool
  if (!functionCall) {
    return response.text;
  }

  // IMPORTANT:
  // Always preserve Gemini's original model parts.
  // This keeps the thoughtSignature.
  const modelParts = response.candidates[0].content.parts;

  let result;

  // ==============================
  // GET SINGLE ORDER
  // ==============================

  if (functionCall.name === "getOrderStatus") {
    const orderNumber = functionCall.args.orderNumber;

    result = await getOrderStatus(
      orderNumber,
      userId
    );
  }

  // ==============================
  // GET ALL ORDERS
  // ==============================

  else if (functionCall.name === "getMyOrders") {
    result = await getMyOrders(userId);
  }

  // Unknown tool
  else {
    return response.text;
  }

  // ==============================
  // SEND TOOL RESULT BACK TO GEMINI
  // ==============================

  const finalResponse = await ai.models.generateContent({
    model: "gemini-3.8-flash",

    contents: [
      {
        role: "user",
        parts: [
          {
            text: message,
          },
        ],
      },

      // Preserve original Gemini response.
      // Do NOT recreate the functionCall manually.
      {
        role: "model",
        parts: modelParts,
      },

      {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: result,
            },
          },
        ],
      },
    ],

    config: {
      tools,
    },
  });

  return finalResponse.text;
}