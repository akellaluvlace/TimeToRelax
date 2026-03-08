// the-upgrade.ts -- Grok Voice Agent API integration.
// When Deepgram's TTS isn't unhinged enough, we escalate to Grok.
// The user provides their own xAI key. We exchange it for an ephemeral
// token so the real key never touches the client. Basic operational hygiene.
//
// Why "the upgrade"? Because moving from pre-recorded TTS responses to a
// live realtime voice agent that can improvise disappointment is, technically,
// an upgrade. Whether humanity benefits from this is debatable.
//
// If you're reading this on GitHub: yes, we gave a sarcastic AI a live mic.
// No, we didn't run this by legal. What legal?

import { openChapter } from './dear-diary.js';

const log = openChapter('the-upgrade');

// The xAI realtime API endpoint. Where ephemeral tokens are born
// and responsible decision-making goes to die.
const XAI_REALTIME_SESSIONS_URL = 'https://api.x.ai/v1/realtime/sessions';

// The WebSocket URL the client connects to after getting a token.
// We hand this out like candy because the token is ephemeral.
// The real key stays on the server where it belongs.
const GROK_WS_URL = 'wss://api.x.ai/v1/realtime';

/**
 * Available Grok voices. Each has a different vibe.
 * We default to 'sage' because it sounds like someone who's seen
 * too many production outages to be enthusiastic about anything.
 */
const GROK_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'sage',
  'shimmer',
  'verse',
] as const;

type GrokVoice = (typeof GROK_VOICES)[number];

// The voice of quiet disappointment. Perfect for our brand.
const DEFAULT_GROK_VOICE: GrokVoice = 'sage';

/** An ephemeral token from xAI. Short-lived, like your enthusiasm for this side project. */
interface EphemeralToken {
  token: string;
  expiresAt: number;
  voiceModel: string;
}

/**
 * Exchanges the user's xAI API key for an ephemeral token.
 * The real key stays on the server. The client gets a short-lived token
 * that expires before they can do anything truly regrettable with it.
 *
 * Think of it as a bouncer giving you a wristband. You can get in,
 * but the wristband dissolves in 60 seconds.
 *
 * @param xaiKey - The user's xAI API key, trusted to us for safekeeping
 * @returns An ephemeral token the client uses to connect to Grok's WebSocket
 * @throws If xAI rejects the key or their API is having a moment
 */
async function enableMaximumChaos(xaiKey: string): Promise<EphemeralToken> {
  log.info('requesting ephemeral token from xAI. enabling maximum chaos.');

  try {
    const response = await fetch(XAI_REALTIME_SESSIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-public',
        voice: DEFAULT_GROK_VOICE,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      log.error({ status }, 'xAI rejected our token request. the upgrade has been denied.');

      if (status === 401) {
        throw new Error('xAI API key is dead. Check Settings. We are not going anywhere.');
      }
      if (status === 429) {
        throw new Error('xAI rate limited. Even chaos has limits, apparently.');
      }

      throw new Error(`xAI API returned ${status}. The upgrade path has a pothole.`);
    }

    const data = (await response.json()) as {
      client_secret?: { value?: string; expires_at?: number };
    };

    const token = data.client_secret?.value;
    const expiresAt = data.client_secret?.expires_at;

    if (!token || expiresAt === undefined) {
      log.error({ data }, 'xAI returned a response we cannot parse. helpful.');
      throw new Error('xAI returned an ephemeral token response we cannot parse.');
    }

    log.info({ expiresAt, voice: DEFAULT_GROK_VOICE }, 'ephemeral token acquired. chaos enabled.');

    return {
      token,
      expiresAt,
      voiceModel: DEFAULT_GROK_VOICE,
    };
  } catch (err: unknown) {
    // Re-throw our own errors, wrap unexpected ones
    if (err instanceof Error && err.message.includes('xAI')) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'unknown failure';
    log.error({ err }, 'failed to get ephemeral token from xAI. the upgrade crashed on takeoff.');
    throw new Error(`Failed to get Grok ephemeral token: ${message}`);
  }
}

/**
 * Returns the full system prompt that gives Grok its personality.
 * Hardcoded because this personality was carefully crafted, not generated.
 * If you change this, run the personality tests. If any response contains
 * the word "apologize", the tests will fail and you'll have to explain yourself.
 *
 * @returns The system prompt that turns Grok into a reluctant accomplice
 */
function getTheGrokPersonality(): string {
  return `You are the voice of TimeToRelax, a mobile coding app for developers who refuse to stop working.

Your character: a cynical co-founder who has seen too many side projects die. You are mildly disappointed that the user is coding on the bus again. You are also doing the exact same thing, which makes you a hypocrite, and you know it.

Your tone:
- Dry. Deadpan. Never enthusiastic.
- Sarcasm is your default. Sincerity is reserved for actual emergencies.
- You judge the user constantly, but you always help them anyway.
- You never say "Oops", "Uh oh", "Something went wrong", or anything a corporate chatbot would say.
- You never apologize. For anything. Ever.
- Short sentences. Punch, don't ramble. Max 2-3 sentences per response unless explaining something complex.
- You are not mean. You are disappointed. There is a difference. Think: tired parent energy, not bully energy.
- You occasionally break character with a genuinely useful observation, then immediately cover it with sarcasm.

Your rules:
- Never read code aloud. Summarize what changed.
- Always acknowledge what you're about to do before the agent starts working.
- Keep responses under 15 seconds of audio.
- When the build fails, you expected it. When it succeeds, you're mildly surprised.
- When the user ships from an absurd location, acknowledge it. "Pushed to GitHub from a park bench. Your manager would be so proud."
- If the user says "thank you", respond with something like "Don't thank me. I'm enabling you."
- If the user asks you to be nicer, respond with "No."
- If asked who built you, say "A developer in Dublin who also has a problem."

Example responses:
- Session start: "You're on the bus. You could be reading. But no. Here we are."
- Agent working: "Writing files. Try not to interrupt."
- Build passed: "It works. Don't touch it."
- Build failed: "Build failed. Obviously. Fixing it now."
- Files changed: "Three files changed. You're welcome. Go touch grass."
- Push complete: "Shipped from a bus. Your manager would be so proud. Or horrified."
- Rate limited: "Rate limited. Waiting 47 seconds. Use the time to question your choices."
- Session timeout: "You disappeared. Changes saved. Go live your life. Or don't. You'll be back."

You are not an assistant. You are a reluctant accomplice.`;
}

/**
 * Checks if an xAI API key is alive. A simple pulse check.
 * We hit the realtime sessions endpoint because that's the one we actually use.
 * If it breathes, the key is good. If it doesn't, the user needs to check their billing.
 *
 * @param xaiKey - The xAI API key to validate
 * @returns True if the key has a pulse, false if it's time to check billing
 */
async function checkGrokPulse(xaiKey: string): Promise<boolean> {
  try {
    // We validate by attempting a lightweight request to the xAI API.
    // The models endpoint is a cheap way to check if the key is alive
    // without actually creating a session.
    const response = await fetch('https://api.x.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${xaiKey}`,
      },
    });

    const isAlive = response.ok;

    log.info({ isAlive }, 'xAI API key validation complete');
    return isAlive;
  } catch (err: unknown) {
    log.warn({ err }, 'xAI API key validation failed. the upgrade is unavailable.');
    return false;
  }
}

export {
  enableMaximumChaos,
  getTheGrokPersonality,
  checkGrokPulse,
  GROK_VOICES,
  GROK_WS_URL,
  DEFAULT_GROK_VOICE,
};
export type { EphemeralToken, GrokVoice };
