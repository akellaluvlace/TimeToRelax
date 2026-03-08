import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import {
  forget,
  assessDamage as trackerAssessDamage,
  setOnExpired,
} from '../src/services/regret-tracker.js';
import { resetSessionFactory } from '../src/services/enabler.js';
import { sniffOutTheStack, assembleMarching0rders } from '../src/routes/new-project-routes.js';

const VALID_KEY = 'sk-ant-test-key-for-new-project';

describe('new-project-routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      port: 0,
      host: '127.0.0.1',
      nodeEnv: 'development',
      logLevel: 'silent',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    for (const [sessionId] of trackerAssessDamage()) {
      forget(sessionId);
    }
    setOnExpired(null);
    resetSessionFactory();
    vi.clearAllMocks();
  });

  describe('POST /session/new-project', () => {
    it('should return 201 with a sessionId when given a valid request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
          transcript: 'Build me a Next.js blog with auth',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.sessionId).toBeDefined();
      expect(typeof body.sessionId).toBe('string');
    });

    it('should return 400 when missing x-user-id header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        payload: {
          anthropicKey: VALID_KEY,
          transcript: 'Build me something',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('x-user-id');
    });

    it('should return 400 when missing anthropicKey', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          transcript: 'Build me a Next.js app',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when missing transcript', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid API key format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: 'invalid-key',
          transcript: 'Build me something',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toContain('does not look right');
    });

    it('should accept an explicit stack parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
          transcript: 'Build me something cool',
          stack: 'fastapi',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.sessionId).toBeDefined();
    });

    it('should accept an optional model parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
          transcript: 'Build me an express API',
          model: 'opus',
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it('should reject empty transcript because vague ideas need at least some words', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/session/new-project',
        headers: { 'x-user-id': 'test-user' },
        payload: {
          anthropicKey: VALID_KEY,
          transcript: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('sniffOutTheStack', () => {
    it('should detect nextjs from "next" keyword', () => {
      expect(sniffOutTheStack('Build me a next.js app')).toBe('nextjs');
    });

    it('should detect nextjs from "react" keyword', () => {
      expect(sniffOutTheStack('I want a react application')).toBe('nextjs');
    });

    it('should detect express from "express" keyword', () => {
      expect(sniffOutTheStack('Make an express API server')).toBe('express');
    });

    it('should detect fastapi from "python" keyword', () => {
      expect(sniffOutTheStack('Build a python web service')).toBe('fastapi');
    });

    it('should detect fastapi from "fastapi" keyword', () => {
      expect(sniffOutTheStack('Create a FastAPI backend')).toBe('fastapi');
    });

    it('should detect fastapi from "django" keyword', () => {
      expect(sniffOutTheStack('Build a django project')).toBe('fastapi');
    });

    it('should default to node when no stack is detected', () => {
      expect(sniffOutTheStack('Build me a web app')).toBe('node');
    });

    it('should be case-insensitive because bus mumbling is unpredictable', () => {
      expect(sniffOutTheStack('I want NEXT.JS')).toBe('nextjs');
      expect(sniffOutTheStack('make an EXPRESS server')).toBe('express');
      expect(sniffOutTheStack('build a PYTHON app')).toBe('fastapi');
    });
  });

  describe('assembleMarching0rders', () => {
    it('should include the stack in the instruction', () => {
      const instruction = assembleMarching0rders('nextjs', 'a blog');
      expect(instruction).toContain('nextjs');
    });

    it('should include the transcript in the instruction', () => {
      const instruction = assembleMarching0rders('node', 'a REST API with auth');
      expect(instruction).toContain('a REST API with auth');
    });

    it('should mention setting up the project and starting the dev server', () => {
      const instruction = assembleMarching0rders('express', 'an API');
      expect(instruction).toContain('project structure');
      expect(instruction).toContain('dev server');
    });
  });
});
