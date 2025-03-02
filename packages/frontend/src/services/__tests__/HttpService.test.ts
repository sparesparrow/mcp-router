import { HttpService } from '../implementations/HttpService';
import { AppError, ErrorCode } from '../../utils/ErrorHandler';

// Mock fetch API
global.fetch = jest.fn();

describe('HttpService', () => {
  let httpService: HttpService;
  const mockBaseUrl = 'http://test-api.com';

  beforeEach(() => {
    httpService = new HttpService(mockBaseUrl);
    jest.clearAllMocks();
  });

  describe('get method', () => {
    it('should make a GET request and return data on success', async () => {
      const mockResponse = { data: 'test data' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        status: 200,
      });

      const result = await httpService.get('/test-endpoint');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.com/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw AppError when request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValueOnce({ message: 'Server error' }),
      });

      await expect(httpService.get('/test-endpoint'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('post method', () => {
    it('should make a POST request with the correct payload', async () => {
      const mockResponse = { success: true };
      const mockData = { name: 'Test' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        status: 201,
      });

      const result = await httpService.post('/create', mockData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api.com/create',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
}); 