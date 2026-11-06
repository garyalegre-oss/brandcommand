import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { optimizeContentOffline } from '@/lib/offlineOptimizer';
import { Brand, PostFormat } from '@/types/brand';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brand,
      format,
      currentData,
      instruction,
      apiKey: customApiKey
    }: {
      brand: Brand;
      format: PostFormat;
      currentData: unknown;
      instruction: string;
      apiKey?: string;
    } = body;

    if (!brand || !format || !currentData || !instruction) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMETERS', message: 'brand, format, currentData, and instruction are required.' },
        { status: 400 }
      );
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_TTS_API_KEY;

    // If an API key is available, use Gemini 2.5 Flash for state-of-the-art intelligent editing
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are an elite creative director and social media copywriter for the brand "${brand.name}".
Brand Category: ${brand.category}
Brand Voice Persona: ${brand.voicePersona}
Brand Tagline: ${brand.tagline}
Target Audience: ${brand.targetAudience}

Current Content Format: "${format}"
Current Content Data (JSON):
${JSON.stringify(currentData, null, 2)}

User's Revision & Optimization Instruction:
"${instruction}"

Your task is to carefully analyze the current content and apply the user's instructions while maintaining the brand's unique voice and visual standards.
Output MUST be a valid JSON object matching the exact structure of the input format, accompanied by an "explanation" string detailing what was changed.

JSON Schema to return:
{
  "optimizedData": <UPDATED_OBJECT_MATCHING_INPUT_STRUCTURE>,
  "explanation": "Brief 1-2 sentence summary of what was optimized (e.g. 'Strengthened hook on slide 1 with urgency, added metric proof on slide 3, and tightened CTA.')"
}

Return ONLY the raw JSON object, without markdown backticks or commentary.`;

        const interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash',
          input: prompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json'
          }
        });

        const rawText = interaction.output_text;
        if (rawText) {
          try {
            const parsed = JSON.parse(rawText);
            return NextResponse.json({
              success: true,
              data: parsed.optimizedData || parsed.data || parsed,
              explanation: parsed.explanation || 'Content optimized with Google Gemini 3.8 Flash.',
              source: 'gemini'
            });
          } catch {
            // If JSON parse fails, fall through to offline optimizer
            console.warn('Gemini response was not valid JSON, falling back to heuristic optimizer');
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to heuristic optimizer:', geminiErr);
      }
    }

    // Heuristic offline optimizer fallback
    const offlineResult = optimizeContentOffline(brand, format, currentData, instruction);
    return NextResponse.json({
      success: true,
      data: offlineResult.data,
      explanation: offlineResult.explanation,
      source: 'offline-heuristic'
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
