import request from 'supertest';
import app from '../src/app';

describe('App', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/unknown', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown');
      expect(response.status).toBe(404);
    });
  });
});
