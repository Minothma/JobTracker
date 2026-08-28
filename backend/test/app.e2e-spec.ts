import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

jest.setTimeout(60000);

describe('Job Application Tracker API (E2E)', () => {
  let app: INestApplication;
  let user1Token: string;
  let user1RefreshToken: string;
  let user2Token: string;
  let testAppId: string;
  let testInterviewId: string;
  let testNoteId: string;

  const testEmail1 = `user1_${Date.now()}@example.com`;
  const testEmail2 = `user2_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('POST /api/v1/auth/register - should register User 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: testEmail1, password: testPassword })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(testEmail1);

      user1Token = res.body.accessToken;
      user1RefreshToken = res.body.refreshToken;
    });

    it('POST /api/v1/auth/register - should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: testEmail1, password: testPassword })
        .expect(409);
    });

    it('POST /api/v1/auth/login - should login User 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail1, password: testPassword })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      user1Token = res.body.accessToken;
    });

    it('POST /api/v1/auth/refresh - should refresh access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user1RefreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      user1Token = res.body.accessToken;
    });

    it('POST /api/v1/auth/register - should register User 2 for scoping test', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: testEmail2, password: testPassword })
        .expect(201);

      user2Token = res.body.accessToken;
    });
  });

  describe('Users Profile', () => {
    it('GET /api/v1/users/me - should return authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.email).toBe(testEmail1);
    });
  });

  describe('Applications CRUD & Scoping', () => {
    it('POST /api/v1/applications - should create new application for User 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          company_name: 'Google',
          role_title: 'SWE Intern',
          applied_date: '2026-03-01',
          status: 'APPLIED',
          job_posting_url: 'https://careers.google.com/jobs/123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.company_name).toBe('Google');
      expect(res.body.status).toBe('APPLIED');
      testAppId = res.body.id;
    });

    it('GET /api/v1/applications - User 1 should see their application', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((app: any) => app.id === testAppId)).toBe(true);
    });

    it('GET /api/v1/applications - User 2 must NOT see User 1 application (scoping test)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.some((app: any) => app.id === testAppId)).toBe(false);
    });

    it('GET /api/v1/applications/:id - User 2 cannot access User 1 application by ID', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/applications/${testAppId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('PATCH /api/v1/applications/:id - User 1 can update application status (Kanban move)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/applications/${testAppId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'INTERVIEW' })
        .expect(200);

      expect(res.body.status).toBe('INTERVIEW');
    });
  });

  describe('Interviews Flow', () => {
    it('POST /api/v1/applications/:appId/interviews - should add interview round', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/applications/${testAppId}/interviews`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          round_type: 'Technical Round 1',
          scheduled_at: '2026-03-15T10:00:00.000Z',
          notes: 'Focus on Data Structures and Algorithms',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.round_type).toBe('Technical Round 1');
      testInterviewId = res.body.id;
    });

    it('PATCH /api/v1/interviews/:id - should update interview outcome', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/interviews/${testInterviewId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ outcome: 'PASSED' })
        .expect(200);

      expect(res.body.outcome).toBe('PASSED');
    });

    it('DELETE /api/v1/interviews/:id - User 2 cannot delete User 1 interview', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/interviews/${testInterviewId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });
  });

  describe('Notes Flow', () => {
    it('POST /api/v1/applications/:appId/notes - should add note to application', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/applications/${testAppId}/notes`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Recruiter called to schedule technical interview.' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Recruiter called to schedule technical interview.');
      testNoteId = res.body.id;
    });

    it('DELETE /api/v1/notes/:id - User 2 cannot delete User 1 note', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('DELETE /api/v1/notes/:id - User 1 can delete note', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
    });
  });

  describe('Resumes Flow', () => {
    it('POST /api/v1/resumes/upload-url - should generate presigned upload URL and resume ID', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/resumes/upload-url')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          filename: 'Minothma_Resume_SWE.pdf',
          version_label: 'SWE Focused v1',
        })
        .expect(201);

      expect(res.body).toHaveProperty('resume_id');
      expect(res.body).toHaveProperty('upload_url');
      expect(res.body).toHaveProperty('s3_key');
    });

    it('GET /api/v1/resumes - should list resumes for User 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/resumes')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].version_label).toBe('SWE Focused v1');
    });
  });

  describe('Application Deletion Cascade', () => {
    it('DELETE /api/v1/applications/:id - should delete application', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/applications/${testAppId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/api/v1/applications/${testAppId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });
});
