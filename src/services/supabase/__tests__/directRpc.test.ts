jest.mock('../../../config/environment', () => ({
  supabaseConfig: {
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {directRpc, DirectRpcError} from '../directRpc';

type MockResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

describe('directRpc', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = mockFetch;
  });

  it('parses JSON payload for 200 responses', async () => {
    const payload = [{id: 'row-1'}];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(payload),
    } satisfies MockResponse);

    const result = await directRpc<any[]>({
      functionName: 'get_leaderboard',
      params: {},
      accessToken: 'token-123',
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual(payload);
  });

  it('treats 204 no-content as success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    } satisfies MockResponse);

    const result = await directRpc<void>({
      functionName: 'delete_own_account',
      params: {},
      accessToken: 'token-123',
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it('treats empty successful body as success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    } satisfies MockResponse);

    const result = await directRpc<void>({
      functionName: 'delete_own_account',
      params: {},
      accessToken: 'token-123',
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it('returns structured error for non-OK responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Not authenticated',
    } satisfies MockResponse);

    const result = await directRpc<void>({
      functionName: 'delete_own_account',
      params: {},
      accessToken: 'token-123',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(DirectRpcError);
    expect((result.error as DirectRpcError).status).toBe(401);
    expect(result.error?.message).toContain('RPC error 401');
  });

  it('returns timeout error on abort', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    const result = await directRpc<void>({
      functionName: 'delete_own_account',
      params: {},
      accessToken: 'token-123',
      timeoutMs: 1,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(DirectRpcError);
    expect(result.error?.message).toContain('timed out');
  });
});
