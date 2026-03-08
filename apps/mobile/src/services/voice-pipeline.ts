// voice-pipeline.ts -- The mobile client for voice I/O.
// Sends audio to the backend, gets transcripts back.
// Sends text to the backend, gets audio back.
//
// All the heavy lifting (Deepgram API calls) happens server-side
// because API keys belong on servers, not on phones that get
// left face-down on bus seats.
//
// For MVP, this is plain HTTP fetch. WebSocket streaming is step 17.
// Sometimes you ship the simple thing first. Revolutionary concept.

import { openBooth } from './confessional';

const log = openBooth('voice-pipeline');

// Reconnect delays for future WebSocket upgrade (step 17).
// Exponential backoff because pestering a dead server
// is a waste of everyone's battery life.
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 10000] as const;

/** The shape of a transcription response from the backend. */
interface TranscriptionResult {
  transcript: string;
  confidence: number;
}

/**
 * Sends recorded audio to the backend and gets a transcript back.
 * The audio travels from your phone to our server to Deepgram and back.
 * All so you don't have to type on the bus.
 *
 * @param audioUri - Local file URI of the recorded audio
 * @param backendUrl - Base URL of the backend server
 * @returns The transcript and confidence score from Deepgram
 * @throws If the network request fails or the backend returns an error
 */
async function confessToTheServer(
  audioUri: string,
  backendUrl: string,
): Promise<TranscriptionResult> {
  log.debug('preparing to send audio to backend', { audioUri });

  try {
    // Fetch the audio file from the local URI.
    // On mobile, audio files are stored as local URIs that fetch can read.
    const audioResponse = await fetch(audioUri);
    const audioBlob = await audioResponse.blob();

    log.debug('audio file loaded, sending to backend', {
      blobSize: audioBlob.size,
    });

    const response = await fetch(`${backendUrl}/voice/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: audioBlob,
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('transcription request failed', {
        status: response.status,
        body: errorText,
      });
      throw new Error(
        `Transcription failed with status ${response.status}: ${errorText}`,
      );
    }

    const result: unknown = await response.json();

    // Narrow the unknown response to our expected shape.
    // Trust nobody. Not even our own backend.
    if (
      typeof result === 'object' &&
      result !== null &&
      'transcript' in result &&
      'confidence' in result &&
      typeof (result as TranscriptionResult).transcript === 'string' &&
      typeof (result as TranscriptionResult).confidence === 'number'
    ) {
      const typed = result as TranscriptionResult;
      log.info('transcription received', {
        transcriptLength: typed.transcript.length,
        confidence: typed.confidence,
      });
      return typed;
    }

    log.error('unexpected transcription response shape', { result });
    throw new Error('Backend returned an unexpected response shape for transcription.');
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Voice transmission failed for unknown reasons';
    log.error('confessToTheServer failed', { error: message });
    throw err instanceof Error ? err : new Error(message);
  }
}

/**
 * Asks the backend to generate a voice response and returns the audio URL.
 * The backend talks to Deepgram TTS so we don't have to store the key
 * on your phone next to your embarrassing photo gallery.
 *
 * @param text - The text to convert to speech
 * @param backendUrl - Base URL of the backend server
 * @returns A blob URL pointing to the audio data for playback
 * @throws If the network request fails or the backend returns an error
 */
async function hearTheVerdict(
  text: string,
  backendUrl: string,
): Promise<string> {
  log.debug('requesting TTS from backend', { textLength: text.length });

  try {
    const response = await fetch(`${backendUrl}/voice/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('TTS request failed', {
        status: response.status,
        body: errorText,
      });
      throw new Error(
        `TTS failed with status ${response.status}: ${errorText}`,
      );
    }

    // Get the audio as a blob and create a URL for playback.
    // The blob URL is temporary and lives as long as the app needs it.
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    log.info('TTS audio received', { audioSize: audioBlob.size });

    return audioUrl;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'TTS request failed for unknown reasons';
    log.error('hearTheVerdict failed', { error: message });
    throw err instanceof Error ? err : new Error(message);
  }
}

export { confessToTheServer, hearTheVerdict, RECONNECT_DELAYS };
export type { TranscriptionResult };
