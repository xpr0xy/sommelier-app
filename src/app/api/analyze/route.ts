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

    // Using Gemini 2.5 Flash (latest stable model for new API keys)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert sommelier AI. Extract a list of specific wine names from this menu image. 
      CRITICAL INSTRUCTION: You MUST extract and include the vintage (year) for every single wine if it is visible anywhere on the page (check the edges of the columns or under the names). 
      If no year is listed, explicitly append "NV" (Non-Vintage) to the name.
      Include the producer/winery, the specific cuvée/blend, the grape varietal, and the region if available.
      Return a JSON object with a key "wines" containing an array of strings.
      Example: {"wines": ["Silver Oak Alexander Valley Cabernet Sauvignon 2018", "Krug Grande Cuvée Brut Champagne NV"]}
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
