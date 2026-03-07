// @timetorelax/shared -- the types that hold this thing together.
// If you're reading this on GitHub, hi. These are the contracts.
// The jokes are in the implementation packages. These stay professional.
// Mostly.

export {
  SessionPhase,
  AgentModel,
  type SessionConfig,
  type SessionState,
} from './session.js';

export {
  AgentEventType,
  type FileChangedData,
  type DiffUpdateData,
  type BuildResultData,
  type PreviewReadyData,
  type AgentErrorData,
  type PushCompleteData,
  type VoiceResponseData,
  type AgentEvent,
} from './events.js';

export {
  VoiceProvider,
  VoiceState,
  type TranscriptChunk,
} from './voice.js';

export {
  AppErrorCode,
  type AppError,
  type ErrorResponse,
} from './errors.js';

export type {
  HealthResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  InstructRequest,
  InstructResponse,
  AcceptChangesRequest,
  AcceptChangesResponse,
  SessionStateResponse,
  EndSessionResponse,
  ValidateKeyRequest,
  ValidateKeyResponse,
  VoiceTokenRequest,
  VoiceTokenResponse,
  UserSettings,
} from './api.js';

export {
  PersonalityState,
  PersonalitySource,
  type PersonalityTemplate,
  type PersonalityResponse,
} from './personality.js';
