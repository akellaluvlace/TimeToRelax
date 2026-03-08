// mouth-and-ears.ts -- The Deepgram integration layer.
// Handles both sides of the conversation: hearing (STT) and speaking (TTS).
// Named "mouth and ears" because that's literally what this service is.
// One listens to your mumbled bus instructions. The other talks back.
//
// If you're reading this on GitHub: yes, the audio goes from your phone
// to our server to Deepgram and back. All so you don't have to type
// on the 46A at rush hour. You're welcome.

import { DeepgramClient } from '@deepgram/sdk';

import { openChapter } from './dear-diary.js';

const log = openChapter('mouth-and-ears');

// Below this confidence, we pretend we didn't hear anything.
// It's not rude. It's quality control.
const MINIMUM_SELF_RESPECT = 0.05;

const STT_CONFIG = {
  model: 'nova-3' as const,
  language: 'en',
  smart_format: true,
  punctuate: true,
};

// Placeholder voice. Will be A/B tested once real humans
// start using this and have opinions about everything.
const TTS_VOICE = 'aura-asteria-en';

// Lazy-initialized Deepgram client. Created on first use because
// we don't want to fail at import time if the key isn't set.
// That would be too honest.
let cachedClient: DeepgramClient | null = null;

/**
 * Gets or creates the Deepgram client. Lazy because failing at import
 * time would reveal our inadequacies too early.
 *
 * @returns The Deepgram client, ready to judge your pronunciation
 * @throws If DEEPGRAM_API_KEY is not set, because we can't hear without ears
 */
function getClient(): DeepgramClient {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env['DEEPGRAM_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'DEEPGRAM_API_KEY is not set. We literally cannot hear you without it.',
    );
  }

  cachedClient = new DeepgramClient({ apiKey });
  log.info('deepgram client initialized. ears are open.');
  return cachedClient;
}

/**
 * Resets the cached client. Used in tests to ensure a fresh start.
 * In production, you should never need this. But here we are.
 */
function resetClient(): void {
  cachedClient = null;
}

/**
 * Sends audio to Deepgram Nova-3 and returns what the user mumbled.
 * Works through bus noise, Irish accents, and existential dread.
 *
 * Returns an empty transcript if confidence is below MINIMUM_SELF_RESPECT
 * because some things are better left unheard.
 *
 * @param audioBuffer - Raw audio data from the user's phone
 * @returns The transcript and how confident Deepgram is about it
 * @throws If the Deepgram API key is missing or the API call fails
 */
async function hearConfession(
  audioBuffer: Buffer,
): Promise<{ transcript: string; confidence: number }> {
  const client = getClient();

  log.debug({ audioSize: audioBuffer.length }, 'sending audio to deepgram for transcription');

  try {
    // Deepgram SDK v5: client.listen.v1.media.transcribeFile(uploadable, options)
    // Returns HttpResponsePromise<MediaTranscribeResponse> which resolves to the response body.
    const response = await client.listen.v1.media.transcribeFile(audioBuffer, STT_CONFIG);

    // The response is MediaTranscribeResponse = ListenV1Response | ListenV1AcceptedResponse.
    // ListenV1Response has .results.channels[].alternatives[].transcript/confidence.
    // We access defensively because Deepgram's types mark everything optional.
    const typedResponse = response as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{
            transcript?: string;
            confidence?: number;
          }>;
        }>;
      };
    };

    const channels = typedResponse.results?.channels;
    const firstChannel = channels?.[0];
    const firstAlternative = firstChannel?.alternatives?.[0];

    const transcript = firstAlternative?.transcript ?? '';
    const confidence = firstAlternative?.confidence ?? 0;

    // If Deepgram isn't sure, we're not repeating it.
    // Standards. We have them. Sometimes.
    if (confidence < MINIMUM_SELF_RESPECT) {
      log.warn(
        { confidence, threshold: MINIMUM_SELF_RESPECT },
        'transcript confidence below minimum self-respect threshold. ignoring.',
      );
      return { transcript: '', confidence };
    }

    log.info(
      { transcriptLength: transcript.length, confidence },
      'transcription complete',
    );

    return { transcript, confidence };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'STT failed for reasons we cannot explain';
    log.error({ err }, 'deepgram STT failed. the ears are broken.');
    throw new Error(`Deepgram STT failed: ${message}`);
  }
}

/**
 * Sends text to Deepgram Aura-2 TTS and returns audio.
 * Delivers disappointment in approximately 200ms.
 *
 * @param text - The cynical response text to convert to speech
 * @returns A Buffer containing the audio data (mp3)
 * @throws If the Deepgram API key is missing or the API call fails
 */
async function deliverVerdict(text: string): Promise<Buffer> {
  const client = getClient();

  log.debug({ textLength: text.length }, 'sending text to deepgram TTS');

  try {
    // Deepgram SDK v5: client.speak.v1.audio.generate(request)
    // Returns HttpResponsePromise<BinaryResponse>.
    // BinaryResponse has .arrayBuffer(), .blob(), .stream() methods.
    const binaryResponse = await client.speak.v1.audio.generate({
      text,
      model: TTS_VOICE,
    });

    // Convert the binary response to a Buffer.
    // arrayBuffer() gives us the complete audio data.
    const arrayBuffer = await binaryResponse.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      throw new Error('Deepgram TTS returned empty audio. Silent treatment, apparently.');
    }

    log.info({ audioSize: audioBuffer.length }, 'TTS audio generated');

    return audioBuffer;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TTS failed. we have been silenced.';
    log.error({ err }, 'deepgram TTS failed. the mouth is broken.');
    throw new Error(`Deepgram TTS failed: ${message}`);
  }
}

/**
 * Validates that the Deepgram API key is alive and breathing.
 * Called once on startup so we don't discover it's dead mid-session
 * when the user is three stops past where they meant to get off.
 *
 * @param apiKey - The Deepgram API key to validate
 * @returns True if the key works, false if it's time to check billing
 */
async function checkMicIsOn(apiKey: string): Promise<boolean> {
  try {
    const client = new DeepgramClient({ apiKey });

    // Send a tiny request to validate the key.
    // A minimal transcription request with silence is the cheapest way
    // to check if the key is alive without wasting real audio credits.
    const response = await client.listen.v1.media.transcribeFile(
      Buffer.from([0, 0, 0, 0]),
      { model: 'nova-3' },
    );

    // If we get a response back (even empty), the key is valid.
    // The response resolves to the body itself (ListenV1Response | ListenV1AcceptedResponse).
    const isAlive = response !== undefined;

    log.info({ isAlive }, 'deepgram API key validation complete');
    return isAlive;
  } catch (err: unknown) {
    log.warn({ err }, 'deepgram API key validation failed. the mic is off.');
    return false;
  }
}

export { hearConfession, deliverVerdict, checkMicIsOn, resetClient, MINIMUM_SELF_RESPECT };
