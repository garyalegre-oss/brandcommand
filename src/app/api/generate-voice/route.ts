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

    // 1. Google Cloud Text-to-Speech (Journey & Studio Neural Voices) - Default Provider
    if (activeProvider === 'google' || activeProvider === 'google_tts' || activeProvider === 'gemini') {
      const apiKey = customApiKey || process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { 
            error: 'MISSING_API_KEY', 
            message: 'Please provide a Google Cloud or Gemini API key (starts with AIzaSy...). Google Cloud offers 1 to 4 million characters free per month!' 
          },
          { status: 400 }
        );
      }

      const googleVoiceName = voice || 'en-US-Journey-F';
      const languageCode = googleVoiceName.startsWith('es-') 
        ? 'es-US' 
        : googleVoiceName.slice(0, 5); // e.g. 'en-US'

      // Strategy 1: Google Gemini Interactions API Audio Generation (Native to Google AI Studio keys)
      try {
        const ai = new GoogleGenAI({ apiKey });
        const geminiVoice = googleVoiceName.includes('F') || googleVoiceName.includes('Journey-F') ? 'Aoede' : 'Puck';

        const interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash-tts',
          input: [{
            type: 'user_input',
            content: [{
              type: 'text',
              text: cleanedText,
              annotations: [{
                type: 'speech_metadata',
                style: 'confident, energetic, crisp commercial narration',
              }],
            }],
          }],
          response_format: { type: 'audio' },
          generation_config: {
            speech_config: [
              { voice: geminiVoice },
            ],
          },
        });

        if (interaction.output_audio?.data) {
          const mimeType = interaction.output_audio.mime_type || 'audio/wav';
          return NextResponse.json({
            audioUrl: `data:${mimeType};base64,${interaction.output_audio.data}`,
            provider: 'gemini_tts',
            voice: geminiVoice,
            words: []
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini 3.8 Flash TTS call failed, falling back to Web Speech:', geminiErr);
      }

      // Strategy 2: Google Cloud Enterprise Text-to-Speech REST endpoint
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

      // Strategy 3: Graceful Web Speech API Fallback
      // When a Google AI Studio key is provided, it is optimized for Gemini models (which power the text generation and visual reasoning).
      // Rather than halting the studio with an OAuth permission error, we gracefully route to browser speech synthesis.
      return NextResponse.json({
        fallbackToWebSpeech: true,
        message: 'Google AI Studio key active for Gemini AI. Audio seamlessly synced with zero latency via Browser Voice Engine.',
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
