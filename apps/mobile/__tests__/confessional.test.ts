// confessional.test.ts -- Testing the confession booth.
// Making sure our sins are properly logged.

import { openBooth } from '@/services/confessional';

describe('confessional', () => {
  const originalDev = (global as Record<string, unknown>).__DEV__;

  beforeEach(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (global as Record<string, unknown>).__DEV__ = originalDev;
  });

  it('should open a booth with the given service name', () => {
    const log = openBooth('test-service');
    expect(log).toBeDefined();
    expect(typeof log.debug).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
  });

  it('should include the service name in log output', () => {
    (global as Record<string, unknown>).__DEV__ = true;
    const log = openBooth('my-service');
    log.info('test message');

    expect(console.info).toHaveBeenCalledTimes(1);
    const loggedString = (console.info as jest.Mock).mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(loggedString) as Record<string, unknown>;
    expect(parsed.service).toBe('my-service');
    expect(parsed.message).toBe('test message');
    expect(parsed.level).toBe('info');
  });

  it('should include extra context in log output', () => {
    (global as Record<string, unknown>).__DEV__ = true;
    const log = openBooth('extras');
    log.warn('watch out', { reason: 'testing' });

    const loggedString = (console.warn as jest.Mock).mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(loggedString) as Record<string, unknown>;
    expect(parsed.reason).toBe('testing');
  });

  it('should strip debug logs in production', () => {
    (global as Record<string, unknown>).__DEV__ = false;
    const log = openBooth('prod-service');
    log.debug('this should not appear');

    expect(console.debug).not.toHaveBeenCalled();
  });

  it('should still log info/warn/error in production', () => {
    (global as Record<string, unknown>).__DEV__ = false;
    const log = openBooth('prod-service');
    log.info('info message');
    log.warn('warn message');
    log.error('error message');

    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should include a timestamp in every log entry', () => {
    (global as Record<string, unknown>).__DEV__ = true;
    const log = openBooth('timestamp-check');
    log.info('check the clock');

    const loggedString = (console.info as jest.Mock).mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(loggedString) as Record<string, unknown>;
    expect(parsed.timestamp).toBeDefined();
    expect(typeof parsed.timestamp).toBe('string');
  });
});
