import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: "Server misconfiguration", details: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const file = image;

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Uploaded file must be an image" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Using Gemini 2.5 Pro based on official docs for high reasoning tasks
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert sommelier analyzing a photographed wine menu.

      Task 1: Extract a list of specific wine names from this menu image.
      CRITICAL INSTRUCTION: Include the vintage (year) for every wine if it is visible. If no year is listed, append "NV" (Non-Vintage). Include the producer, cuvée, and grape varietal when visible.

      Task 2: For each wine, provide an estimated Vivino-style score, ratings count, and average market price in USD ONLY if you are genuinely confident from your internal knowledge. If you are not confident, return 0 for that field. Do not invent plausible numbers.

      Return a JSON object with a key "wines" containing an array of objects.
      Each object MUST have the following schema exactly:
      {
        "name": "Full string name of the wine with vintage",
        "score": 4.5, // float between 1.0 and 5.0. 0.0 if totally unknown.
        "ratings": 1500, // integer. 0 if unknown.
        "price": 120 // integer. average retail price in USD. 0 if unknown.
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
    ]);

    const text = result.response.text();
    const data = JSON.parse(text);

    return NextResponse.json({ wines: data.wines || [] });
  } catch (error: unknown) {
    console.error("Gemini Analysis Error:", error);
    const details = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to analyze menu",
        ...(process.env.NODE_ENV !== "production" ? { details } : {}),
      },
      { status: 500 }
    );
  }
}
