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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Extract a list of specific wine names from this menu image. 
      Only include the wine names (and vintage years if available). 
      Format the response as a JSON array of strings. 
      Example: ["Silver Oak Alexander Valley Cabernet 2018", "Jordan Cabernet Sauvignon 2019"].
      Do not include any other text in your response.
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
    // Clean potential markdown from Gemini response
    const cleanJson = text.replace(/```json|```/gi, "").trim();
    const wineNames = JSON.parse(cleanJson);

    return NextResponse.json({ wines: wineNames });
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze menu" }, { status: 500 });
  }
}
