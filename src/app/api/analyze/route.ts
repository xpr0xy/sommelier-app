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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Extract a list of specific wine names from this menu image. 
      Return a JSON object with a key "wines" containing an array of strings.
      Example: {"wines": ["Silver Oak Alexander Valley Cabernet 2018", "Jordan Cabernet Sauvignon 2019"]}
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
