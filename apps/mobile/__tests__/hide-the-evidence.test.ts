import * as SecureStore from 'expo-secure-store';

import {
  hideTheEvidence,
  digUpTheBodies,
  isThereEvidence,
  forgetEverything,
  KEY_SLOTS,
} from '../src/services/hide-the-evidence';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../src/services/confessional', () => ({
  openBooth: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('hide-the-evidence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hideTheEvidence', () => {
    it('should stash a secret like it never happened', async () => {
      await hideTheEvidence(KEY_SLOTS.ANTHROPIC_KEY, 'sk-ant-test-key');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('anthropic_api_key', 'sk-ant-test-key');
    });

    it('should throw when the vault rejects us', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('vault locked'));
      await expect(hideTheEvidence(KEY_SLOTS.GITHUB_TOKEN, 'token')).rejects.toThrow(
        'Failed to hide evidence',
      );
    });
  });

  describe('digUpTheBodies', () => {
    it('should retrieve a stored secret from the vault', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('my-secret-token');
      const result = await digUpTheBodies(KEY_SLOTS.GITHUB_TOKEN);
      expect(result).toBe('my-secret-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('github_oauth_token');
    });

    it('should return null when there is nothing to find', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      const result = await digUpTheBodies(KEY_SLOTS.XAI_KEY);
      expect(result).toBeNull();
    });

    it('should return null instead of crashing when storage fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('corrupted'));
      const result = await digUpTheBodies(KEY_SLOTS.ANTHROPIC_KEY);
      expect(result).toBeNull();
    });
  });

  describe('isThereEvidence', () => {
    it('should confirm existence without revealing the secret', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('something');
      const exists = await isThereEvidence(KEY_SLOTS.GITHUB_TOKEN);
      expect(exists).toBe(true);
    });

    it('should report absence honestly for once', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      const exists = await isThereEvidence(KEY_SLOTS.ANTHROPIC_KEY);
      expect(exists).toBe(false);
    });
  });

  describe('forgetEverything', () => {
    it('should destroy a secret completely', async () => {
      await forgetEverything(KEY_SLOTS.ANTHROPIC_KEY);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('anthropic_api_key');
    });

    it('should throw when destruction fails, because even forgetting can go wrong', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('permission denied'));
      await expect(forgetEverything(KEY_SLOTS.GITHUB_TOKEN)).rejects.toThrow(
        'Failed to forget evidence',
      );
    });
  });

  describe('KEY_SLOTS', () => {
    it('should have all the expected hiding spots', () => {
      expect(KEY_SLOTS.GITHUB_TOKEN).toBe('github_oauth_token');
      expect(KEY_SLOTS.ANTHROPIC_KEY).toBe('anthropic_api_key');
      expect(KEY_SLOTS.XAI_KEY).toBe('xai_api_key');
    });
  });
});
