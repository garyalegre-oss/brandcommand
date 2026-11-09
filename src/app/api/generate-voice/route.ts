import { NextRequest, NextResponse } from 'next/server';
import { cleanSpeechText } from '@/lib/speechUtils';
import { GoogleGenAI } from '@google/genai';

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

function parseAlignmentToWords(alignment: {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  let currentWord = '';
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const start = alignment.character_start_times_seconds[i];
    const end = alignment.character_end_times_seconds[i];

    if (/\s/.test(char)) {
      if (currentWord.trim()) {
        words.push({
          word: currentWord.trim(),
          start: Math.round(wordStart * 1000),
          end: Math.round(wordEnd * 1000)
        });
        currentWord = '';
      }
    } else {
      if (!currentWord) {
        wordStart = start;
      }
      currentWord += char;
      wordEnd = end;
    }
  }

  if (currentWord.trim()) {
    words.push({
      word: currentWord.trim(),
      start: Math.round(wordStart * 1000),
      end: Math.round(wordEnd * 1000)
    });
  }

  return words;
}

// Map BrandCommand studio voice personas to distinct neural TTS voices
function resolveNeuralVoiceCode(voice?: string): string {
  const v = (voice || '').trim();
  switch (v) {
    // Female voices
    case 'en-US-Journey-F':
    case 'en_us_001':
    case 'shimmer':
    case '21m00Tcm4TlvDq8ikWAM':
      return 'en_us_001'; // Viral TikTok / Reels Expressive Female
    case 'en-US-Journey-O':
    case 'en-US-Neural2-F':
    case 'en_au_001':
    case 'nova':
    case 'EXAVITQu4vr4xnSDxMaL':
      return 'en_au_001'; // Warm Modern Creator Female
    // Male voices
    case 'en-US-Journey-D':
    case 'en_us_006':
    case 'onyx':
    case 'pNInz6obpgDQGcFmaJgB':
      return 'en_us_006'; // Deep Confident Male
    case 'en-US-Studio-Q':
    case 'en_us_007':
      return 'en_us_007'; // Authoritative Broadcast Male
    case 'en-US-Neural2-D':
    case 'en_us_009':
    case 'TxGEqnHWrfWFTfGW9XjX':
      return 'en_us_009'; // Energetic Creator Male
    case 'en-US-Studio-O':
    case 'en_uk_001':
    case 'alloy':
      return 'en_uk_001'; // Crisp UK Commercial Narrator
    // Spanish voices
    case 'es-US-Journey-F':
    case 'es_mx_002':
      return 'es_mx_002'; // Natural Latin Spanish
    default:
      if (v.startsWith('es')) return 'es_mx_002';
      if (v.includes('D') || v.includes('Q') || v.includes('Male')) return 'en_us_006';
      return 'en_us_001';
  }
}

// Split text into <= 240-character natural sentence chunks for neural TTS synthesis
function splitTextIntoChunks(text: string, maxLen = 240): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if (!s) continue;
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        // Hard-split long sentence by words
        const words = s.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeKeylessNeuralMp3(text: string, voicePersona?: string): Promise<string | null> {
  try {
    const neuralVoice = resolveNeuralVoiceCode(voicePersona);
    const chunks = splitTextIntoChunks(text, 240);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      const res = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, voice: neuralVoice })
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success || !json.data) return null;
      buffers.push(Buffer.from(json.data, 'base64'));
    }

    if (buffers.length === 0) return null;
    const combined = Buffer.concat(buffers);
    return `data:audio/mp3;base64,${combined.toString('base64')}`;
  } catch (e) {
    console.warn('Keyless neural TTS fallback error:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, provider, voice, apiKey: customApiKey } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Strip all Unicode emojis and markdown characters so TTS speaks pure human voice
    // without reciting emoji descriptions (e.g. "police cars revolving light", "fire", "money bag")
    const cleanedText = cleanSpeechText(text);
    if (!cleanedText) {
      return NextResponse.json({ error: 'Text is required after emoji cleanup' }, { status: 400 });
    }

    const activeProvider = provider || 'google';

    // 1. Google Cloud / Neural Studio Voices - Default Provider (Works with OR without an API key!)
    if (activeProvider === 'google' || activeProvider === 'google_tts' || activeProvider === 'gemini') {
      const apiKey = customApiKey || process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
      const googleVoiceName = voice || 'en-US-Journey-F';
      const languageCode = googleVoiceName.startsWith('es-') 
        ? 'es-US' 
        : googleVoiceName.slice(0, 5); // e.g. 'en-US'

      if (apiKey) {
        // Strategy 1: Google Cloud Enterprise Text-to-Speech REST endpoint (if Cloud TTS API is enabled on key)
        try {
          const googleRes = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey
              },
              body: JSON.stringify({
                input: { text: cleanedText },
                voice: {
                  languageCode,
                  name: googleVoiceName
                },
                audioConfig: {
                  audioEncoding: 'MP3',
                  speakingRate: 1.05
                }
              })
            }
          );

          if (googleRes.ok) {
            const data = await googleRes.json();
            if (data.audioContent) {
              return NextResponse.json({
                audioUrl: `data:audio/mp3;base64,${data.audioContent}`,
                provider: 'google',
                voice: googleVoiceName,
                words: []
              });
            }
          }
        } catch (cloudTtsErr) {
          console.warn('Google Cloud TTS REST call failed:', cloudTtsErr);
        }
      }

      // Strategy 2: Built-In Keyless Studio Neural TTS (Distinct Male, Female, UK, Aussie & Spanish Voices)
      const neuralAudioUrl = await synthesizeKeylessNeuralMp3(cleanedText, googleVoiceName);
      if (neuralAudioUrl) {
        return NextResponse.json({
          audioUrl: neuralAudioUrl,
          provider: 'neural_studio',
          voice: googleVoiceName,
          words: []
        });
      }

      // Strategy 3: Graceful Web Speech API Fallback
      return NextResponse.json({
        fallbackToWebSpeech: true,
        message: 'Audio synced via Browser Voice Engine.',
        provider: 'browser'
      });
    }

    // 2. ElevenLabs Provider with Word-Level Timestamps
    if (provider === 'elevenlabs') {
      const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'MISSING_API_KEY', message: 'Please provide an ElevenLabs API key.' },
          { status: 400 }
        );
      }

      const voiceId = voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel

      // Using the /with-timestamps endpoint for frame-accurate word sync
      const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        })
      });

      if (!elevenRes.ok) {
        // Fallback to standard endpoint if with-timestamps isn't permitted on this tier
        const fallbackRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5'
          })
        });

        if (!fallbackRes.ok) {
          const errText = await fallbackRes.text();
          return NextResponse.json(
            { error: 'ELEVENLABS_ERROR', message: errText || 'Failed to generate voice via ElevenLabs' },
            { status: fallbackRes.status }
          );
        }

        const audioBuffer = await fallbackRes.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        return NextResponse.json({
          audioUrl: `data:audio/mp3;base64,${base64Audio}`,
          words: []
        });
      }

      const data = await elevenRes.json();
      const words = data.alignment ? parseAlignmentToWords(data.alignment) : [];

      return NextResponse.json({
        audioUrl: `data:audio/mp3;base64,${data.audio_base64}`,
        words: words
      });
    }

    // 2. OpenAI TTS Provider
    const apiKey = customApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message: 'Please provide an OpenAI or ElevenLabs API key to generate hyper-realistic studio audio.'
        },
        { status: 400 }
      );
    }

    const openAiVoice = voice || 'nova';

    const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: openAiVoice,
        input: cleanedText,
        speed: 1.05
      })
    });

    if (!openaiRes.ok) {
      const errJson = await openaiRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'OPENAI_ERROR', message: errJson.error?.message || 'Failed to generate speech with OpenAI' },
        { status: openaiRes.status }
      );
    }

    const audioBuffer = await openaiRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      audioUrl: `data:audio/mp3;base64,${base64Audio}`,
      words: []
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
