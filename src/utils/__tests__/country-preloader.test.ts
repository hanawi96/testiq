import { 
  preloadCountryData, 
  getInstantCountryData, 
  isCountryDataReady,
  refreshCountryData,
  preloadTriggers 
} from '../country-preloader';

// Mock the backend import
jest.mock('@/backend', () => ({
  getCountriesWithVietnamFirst: jest.fn(() => 
    Promise.resolve({
      data: [
        { id: 'VN', name: 'Việt Nam', code: 'VN' },
        { id: 'US', name: 'United States', code: 'US' },
        { id: 'SG', name: 'Singapore', code: 'SG' }
      ]
    })
  )
}));

// Mock fetch for JSON fallback
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([
      { name: 'Việt Nam', code: 'VN', emoji: '🇻🇳' },
      { name: 'United States', code: 'US', emoji: '🇺🇸' }
    ])
  })
) as jest.Mock;

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});

describe('Country Preloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache between tests
    refreshCountryData();
  });

  describe('preloadCountryData', () => {
    it('loads countries from database successfully', async () => {
      const countries = await preloadCountryData();
      
      expect(countries).toHaveLength(3);
      expect(countries[0]).toEqual({
        id: 'VN',
        name: 'Việt Nam',
        code: 'VN',
        flag: 'https://country-code-au6g.vercel.app/VN.svg'
      });
    });

    it('caches results to avoid duplicate requests', async () => {
      const backend = await import('@/backend');
      
      // First call
      await preloadCountryData();
      expect(backend.getCountriesWithVietnamFirst).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      await preloadCountryData();
      expect(backend.getCountriesWithVietnamFirst).toHaveBeenCalledTimes(1);
    });

    it('falls back to JSON when database fails', async () => {
      const backend = await import('@/backend');
      backend.getCountriesWithVietnamFirst = jest.fn(() => 
        Promise.reject(new Error('Database error'))
      );

      const countries = await preloadCountryData();
      
      expect(countries).toHaveLength(2);
      expect(countries[0].name).toBe('Việt Nam');
      expect(fetch).toHaveBeenCalledWith('/country.json');
    });

    it('falls back to instant countries when all sources fail', async () => {
      const backend = await import('@/backend');
      backend.getCountriesWithVietnamFirst = jest.fn(() => 
        Promise.reject(new Error('Database error'))
      );
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch error'));

      const countries = await preloadCountryData();
      
      expect(countries).toHaveLength(10); // INSTANT_COUNTRIES length
      expect(countries[0].name).toBe('Việt Nam');
    });
  });

  describe('getInstantCountryData', () => {
    it('returns cached data when available', async () => {
      // Preload first
      await preloadCountryData();
      
      // Get instant data
      const countries = getInstantCountryData();
      
      expect(countries).toHaveLength(3);
      expect(countries[0].name).toBe('Việt Nam');
    });

    it('returns instant fallback when no cache', () => {
      const countries = getInstantCountryData();
      
      expect(countries).toHaveLength(10); // INSTANT_COUNTRIES length
      expect(countries[0].name).toBe('Việt Nam');
    });
  });

  describe('isCountryDataReady', () => {
    it('returns false when no data cached', () => {
      expect(isCountryDataReady()).toBe(false);
    });

    it('returns true when data is cached and fresh', async () => {
      await preloadCountryData();
      expect(isCountryDataReady()).toBe(true);
    });
  });

  describe('preloadTriggers', () => {
    it('onTestStart triggers preload', () => {
      const spy = jest.spyOn(global, 'requestIdleCallback');
      
      preloadTriggers.onTestStart();
      
      expect(spy).toHaveBeenCalled();
    });

    it('onUserInteraction triggers preload when data not ready', () => {
      const spy = jest.spyOn(global, 'requestIdleCallback');
      
      preloadTriggers.onUserInteraction();
      
      expect(spy).toHaveBeenCalled();
    });

    it('onTestProgress triggers preload at 50% completion', async () => {
      const preloadSpy = jest.fn();
      
      // Mock the preload function
      jest.doMock('../country-preloader', () => ({
        ...jest.requireActual('../country-preloader'),
        preloadCountryData: preloadSpy
      }));

      preloadTriggers.onTestProgress(0.3); // Below threshold
      expect(preloadSpy).not.toHaveBeenCalled();

      preloadTriggers.onTestProgress(0.6); // Above threshold
      expect(preloadSpy).toHaveBeenCalled();
    });

    it('onLowTimeRemaining triggers preload at 2 minutes', () => {
      const preloadSpy = jest.fn();
      
      jest.doMock('../country-preloader', () => ({
        ...jest.requireActual('../country-preloader'),
        preloadCountryData: preloadSpy
      }));

      preloadTriggers.onLowTimeRemaining(180); // Above threshold
      expect(preloadSpy).not.toHaveBeenCalled();

      preloadTriggers.onLowTimeRemaining(100); // Below threshold
      expect(preloadSpy).toHaveBeenCalled();
    });

    it('onAppInit triggers delayed preload', (done) => {
      const spy = jest.spyOn(global, 'setTimeout');
      
      preloadTriggers.onAppInit();
      
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 3000);
      done();
    });
  });
});
