/**
 * Utility functions for speech synthesis and text-to-speech audio pipelines.
 * Strips Unicode emojis, pictographs, markdown symbols, and non-spoken characters
 * so that Google Cloud TTS and speech engines pronounce natural, human sentences
 * instead of awkwardly reading emoji descriptions aloud (e.g. "police cars revolving light", "fire").
 */

export function cleanSpeechText(text: string): string {
  if (!text) return '';

  return text
    // Strip Unicode Emojis and Symbols
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons (faces, expressions)
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs (fire, collision, sparkles, charts, bells)
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map (rocket, police car, siren)
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical Symbols
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric Shapes Extended
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental Arrows-C
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols (money bag, brain, handshake)
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess & Gaming Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols & Pictographs Extended-A
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc Symbols (warning sign, dice, coffee)
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats (checkmarks, crosses, scissors, stars)
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '') // Regional Indicator Symbols / Flags
    // Strip markdown formatting characters
    .replace(/[*_~`#|]/g, '')
    // Strip unwanted camera/screen directions if accidentally embedded in voice text (e.g. "[Visual: ...]" or "(0-3s)")
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    // Collapse consecutive whitespace
    .replace(/\s+/g, ' ')
    // Normalize punctuation
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}
