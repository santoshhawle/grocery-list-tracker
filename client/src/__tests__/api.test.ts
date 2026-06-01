import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

let createObjectUrlSpy: ReturnType<typeof vi.spyOn>;
let revokeObjectUrlSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);

  // Spy on static URL methods without breaking the URL constructor
  createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(mockCreateObjectURL);
  revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);

  // Provide token in localStorage
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => (key === 'wbt_token' ? 'test-token' : null)),
    removeItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
  });

  // Stub window.location so href is writable
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  createObjectUrlSpy.mockRestore();
  revokeObjectUrlSpy.mockRestore();
  vi.clearAllMocks();
});

// ─── Import SUT after mocks ───────────────────────────────────────────────────

const { api } = await import('../api');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockCsvResponse(body = 'csv-data') {
  return {
    ok: true,
    status: 200,
    blob: vi.fn().mockResolvedValue(new Blob([body], { type: 'text/csv' })),
    json: vi.fn(),
  };
}

function mockErrorResponse(status: number, errorBody: Record<string, unknown> = {}) {
  return {
    ok: false,
    status,
    blob: vi.fn(),
    json: vi.fn().mockResolvedValue(errorBody),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('api.logs.exportCsv', () => {
  it('should call fetch with Authorization header and not expose token in URL', async () => {
    mockFetch.mockResolvedValue(mockCsvResponse());

    await api.logs.exportCsv({ days: 30 });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/logs/export');
    expect(url).not.toContain('token');
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
  });

  it('should build ?days= param when days is provided', async () => {
    mockFetch.mockResolvedValue(mockCsvResponse());
    await api.logs.exportCsv({ days: 7 });

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('days=7');
  });

  it('should build ?start=&end= params when both are provided', async () => {
    mockFetch.mockResolvedValue(mockCsvResponse());
    await api.logs.exportCsv({ start: '2026-01-01', end: '2026-01-31' });

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('start=2026-01-01');
    expect(url).toContain('end=2026-01-31');
  });

  it('should prefer start/end over days when all three are provided', async () => {
    mockFetch.mockResolvedValue(mockCsvResponse());
    await api.logs.exportCsv({ days: 30, start: '2026-01-01', end: '2026-01-31' });

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('start=2026-01-01');
    expect(url).not.toContain('days=');
  });

  it('should call URL.createObjectURL and trigger an anchor download', async () => {
    mockFetch.mockResolvedValue(mockCsvResponse());
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    await api.logs.exportCsv({ days: 30 });

    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    expect(appendSpy).toHaveBeenCalledOnce();
    expect(removeSpy).toHaveBeenCalledOnce();

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('should call URL.revokeObjectURL after triggering the download (F-8)', async () => {
    mockFetch.mockResolvedValue(mockCsvResponse());
    await api.logs.exportCsv({ days: 30 });
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should throw an error when the server returns a non-200 response', async () => {
    mockFetch.mockResolvedValue(mockErrorResponse(500, { error: 'Export failed' }));
    await expect(api.logs.exportCsv({ days: 30 })).rejects.toThrow('Export failed');
  });

  it('should clear localStorage and throw when the server returns 401', async () => {
    const mockRemoveItem = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'test-token'),
      removeItem: mockRemoveItem,
      setItem: vi.fn(),
      clear: vi.fn(),
    });
    mockFetch.mockResolvedValue(mockErrorResponse(401, { error: 'Authentication required' }));
    await expect(api.logs.exportCsv({ days: 30 })).rejects.toThrow();
    expect(mockRemoveItem).toHaveBeenCalledWith('wbt_token');
    expect(mockRemoveItem).toHaveBeenCalledWith('wbt_user');
  });
});
