// @vitest-environment jsdom
/**
 * The axios instance's interceptors and response unwrapping.
 *
 * The FormData case is a regression test for a real, user-reported bug: image
 * uploads failed with "property file should not exist", an error that points
 * nowhere near its cause. The instance sets a default `Content-Type:
 * application/json`, which makes axios serialise the body as JSON; multer then
 * finds no multipart boundary and no file, and the stray `file` field falls
 * through to the validation pipe.
 *
 * It cost a while to find because a curl reproduction gave a DIFFERENT error -
 * curl sends raw multipart and never involves axios' transformRequest at all.
 * So the test drives the real interceptor rather than an HTTP round trip.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/store/auth-store', () => {
  const state = {
    accessToken: null as string | null,
    admin: null as unknown,
    setSession: vi.fn(),
    setAccessToken: vi.fn(),
    clear: vi.fn(),
  };
  return {
    useAuthStore: { getState: () => state },
    getStoredRefreshToken: () => null,
    __state: state,
  };
});

import { api, unwrap } from './api';
import * as store from '@/store/auth-store';

interface MockAuthState {
  accessToken: string | null;
  admin: unknown;
}
const mockState = (store as unknown as { __state: MockAuthState }).__state;

/** The shape the interceptor reads and writes. Loose on purpose - it is a partial config. */
interface TestConfig {
  url?: string;
  data?: unknown;
  headers: Record<string, string | undefined>;
}

type RequestHandler = { fulfilled: (config: TestConfig) => TestConfig | Promise<TestConfig> };

/**
 * Runs the request interceptor chain the way axios does, without a network call.
 *
 * Driving the real interceptor is the point: an HTTP-level reproduction of the
 * FormData bug behaves differently, because the serialisation that caused it
 * happens inside axios and never happens for a hand-rolled multipart request.
 */
async function runRequestInterceptors(config: Partial<TestConfig>): Promise<TestConfig> {
  const handlers = (
    api.interceptors.request as unknown as { handlers: (RequestHandler | null)[] }
  ).handlers.filter((h): h is RequestHandler => Boolean(h));

  let current: TestConfig = { headers: {}, ...config };
  for (const handler of handlers) {
    current = await handler.fulfilled(current);
  }
  return current;
}

beforeEach(() => {
  mockState.accessToken = null;
});

describe('request interceptor: authorization', () => {
  it('attaches a bearer token when one is stored', async () => {
    mockState.accessToken = 'token-abc';
    const config = await runRequestInterceptors({ url: '/products' });
    expect(config.headers.Authorization).toBe('Bearer token-abc');
  });

  it('sends no Authorization header when there is no token', async () => {
    const config = await runRequestInterceptors({ url: '/products' });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('request interceptor: FormData content type', () => {
  it('removes the JSON content type for a FormData body', async () => {
    // The header MUST be absent, not merely set to multipart/form-data: only
    // the browser can generate the boundary, and it only does so when the
    // header is unset.
    const body = new FormData();
    body.append('file', new Blob(['x'], { type: 'image/png' }), 'a.png');

    const config = await runRequestInterceptors({
      url: '/admin/uploads',
      data: body,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('keeps the JSON content type for a plain object body', async () => {
    const config = await runRequestInterceptors({
      url: '/admin/products',
      data: { name: 'Garam Masala' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('leaves a request with no body alone', async () => {
    const config = await runRequestInterceptors({ url: '/admin/products' });
    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('does not throw where FormData is undefined, as in SSR', async () => {
    // The interceptor guards on `typeof FormData !== 'undefined'` because this
    // module is imported during Next.js server rendering too.
    const original = globalThis.FormData;
    // @ts-expect-error deliberately removing the global for this assertion
    delete globalThis.FormData;
    try {
      const config = await runRequestInterceptors({ url: '/x', data: { a: 1 } });
      expect(config.url).toBe('/x');
    } finally {
      globalThis.FormData = original;
    }
  });
});

describe('unwrap', () => {
  it('unwraps the standard { success, data } envelope', () => {
    expect(unwrap<{ id: string }>({ data: { success: true, data: { id: '1' } } })).toEqual({ id: '1' });
  });

  it('passes through a response that is not enveloped', () => {
    expect(unwrap<{ id: string }>({ data: { id: '1' } })).toEqual({ id: '1' });
  });

  it('unwraps an array payload', () => {
    expect(unwrap<number[]>({ data: { success: true, data: [1, 2, 3] } })).toEqual([1, 2, 3]);
  });

  it('returns null data rather than throwing', () => {
    expect(unwrap<null>({ data: { success: true, data: null } })).toBeNull();
  });

  it('does not mistake a payload that happens to have a data field', () => {
    // A body with `data` but no `success` is not an envelope.
    const body: { data: string } = { data: 'inner' };
    expect(unwrap<{ data: string }>({ data: body })).toEqual({ data: 'inner' });
  });
});
