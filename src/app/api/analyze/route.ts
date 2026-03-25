import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Using Gemini 2.5 Pro (The flagship reasoning and vision model for highest accuracy)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert sommelier AI with web search capabilities.
      
      Task 1: Extract a list of specific wine names from this menu image. 
      CRITICAL INSTRUCTION: You MUST extract and include the vintage (year) for every single wine if it is visible. If no year is listed, explicitly append "NV" (Non-Vintage) to the name. Include the producer, cuvée, and grape varietal.

      Task 2: For each wine you find, search for its Vivino profile or general market data to estimate its Vivino score (e.g. 4.3), its number of ratings, and its average market price in USD.

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
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Return the actual error message in dev/debug to help the user
    return NextResponse.json({ 
      error: "Failed to analyze menu", 
      details: error.message 
    }, { status: 500 });
  }
}
