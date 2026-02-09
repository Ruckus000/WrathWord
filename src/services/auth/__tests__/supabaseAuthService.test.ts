jest.mock('../../../storage/friendCode', () => ({
  getFriendCode: jest.fn(),
}));

jest.mock('../../supabase/client', () => ({
  getSupabase: jest.fn(),
  setCachedSession: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../supabase/directRpc', () => {
  class DirectRpcError extends Error {
    status?: number;
    responseBody?: string;

    constructor(message: string, status?: number, responseBody?: string) {
      super(message);
      this.name = 'DirectRpcError';
      this.status = status;
      this.responseBody = responseBody;
    }
  }

  return {
    directRpc: jest.fn(),
    DirectRpcError,
  };
});

import {supabaseAuthService} from '../supabaseAuthService';
import {getSupabase, setCachedSession} from '../../supabase/client';
import {directRpc, DirectRpcError} from '../../supabase/directRpc';

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;
const mockSetCachedSession = setCachedSession as jest.MockedFunction<typeof setCachedSession>;
const mockDirectRpc = directRpc as jest.MockedFunction<typeof directRpc>;

describe('supabaseAuthService.deleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabase.mockReturnValue(null);
  });

  it('uses passed token and calls delete RPC once on success', async () => {
    mockDirectRpc.mockResolvedValue({data: null, error: null});

    const result = await supabaseAuthService.deleteAccount('token-123');

    expect(result.error).toBeNull();
    expect(mockDirectRpc).toHaveBeenCalledTimes(1);
    expect(mockDirectRpc).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'delete_own_account',
        accessToken: 'token-123',
      }),
    );
    expect(mockSetCachedSession).toHaveBeenCalledWith(null);
  });

  it('retries once after refresh when first RPC fails with auth error', async () => {
    const refreshSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: {id: 'user-1'},
          access_token: 'token-refreshed',
        },
      },
      error: null,
    });
    mockGetSupabase.mockReturnValue({
      auth: {refreshSession},
    } as any);

    mockDirectRpc
      .mockResolvedValueOnce({
        data: null,
        error: new DirectRpcError('RPC error 401: Not authenticated', 401, 'Not authenticated'),
      })
      .mockResolvedValueOnce({data: null, error: null});

    const result = await supabaseAuthService.deleteAccount('token-original');

    expect(result.error).toBeNull();
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(mockDirectRpc).toHaveBeenCalledTimes(2);
    expect(mockDirectRpc).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({accessToken: 'token-original'}),
    );
    expect(mockDirectRpc).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({accessToken: 'token-refreshed'}),
    );
    expect(mockSetCachedSession).toHaveBeenCalledWith({
      user: {id: 'user-1'},
      access_token: 'token-refreshed',
    });
    expect(mockSetCachedSession).toHaveBeenCalledWith(null);
  });

  it('returns TIMEOUT when RPC times out', async () => {
    mockDirectRpc.mockResolvedValue({
      data: null,
      error: new DirectRpcError('Request timed out after 15000ms'),
    });

    const result = await supabaseAuthService.deleteAccount('token-123');

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('TIMEOUT');
  });

  it('returns NO_TOKEN when no token is available', async () => {
    mockGetSupabase.mockReturnValue(null);

    const result = await supabaseAuthService.deleteAccount();

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('NO_TOKEN');
    expect(mockDirectRpc).not.toHaveBeenCalled();
  });
});
