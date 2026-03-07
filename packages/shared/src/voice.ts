// Voice types. Three paths to hearing a disappointed AI judge your life choices.

/** The voice providers, ranked by how much the user is committed to this. */
export const VoiceProvider = {
  /** Deepgram. The sensible default. Our credits, their ears. */
  THE_DEFAULT: 'deepgram',
  /** Grok Voice Agent API. For those who want the full experience. */
  THE_UPGRADE: 'grok',
  /** Device STT. When all else fails. */
  THE_LAST_RESORT: 'device',
} as const;

export type VoiceProvider = (typeof VoiceProvider)[keyof typeof VoiceProvider];

/** What the voice subsystem is doing right now. */
export const VoiceState = {
  /** Not doing anything. Blissful silence. */
  IDLE: 'idle',
  /** Connecting to the voice provider. */
  CONNECTING: 'connecting',
  /** Listening. The mic is hot. */
  LISTENING: 'listening',
  /** Processing the audio into text. */
  PROCESSING: 'processing',
  /** Speaking the response back. */
  SPEAKING: 'speaking',
  /** Something broke. Reconnecting. */
  RECONNECTING: 'reconnecting',
  /** Voice is unavailable. Time for the last resort. */
  UNAVAILABLE: 'unavailable',
} as const;

export type VoiceState = (typeof VoiceState)[keyof typeof VoiceState];

/** A chunk of transcribed audio from STT. */
export interface TranscriptChunk {
  /** The transcribed text. What the user actually said (probably). */
  text: string;
  /** Whether this is the final transcript for this utterance. */
  isFinal: boolean;
  /** Confidence score from the STT provider. Below MINIMUM_SELF_RESPECT we ignore it. */
  confidence: number;
  /** Unix timestamp (ms) when this chunk was received. */
  timestamp: number;
}
