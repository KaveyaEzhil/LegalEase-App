import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // ramp up to 100 users
    { duration: '40s', target: 100 }, // stay at 100 users
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete under 1s
    http_req_failed: ['rate<0.01'],    // error rate less than 1%
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';
  
  // 1. GET request baseline load
  const resGet = http.get(baseUrl);
  check(resGet, {
    'status is 200 (GET)': (r) => r.status === 200,
  });
  sleep(0.5);

  // 2. POST request simulation on /process if applicable
  const payload = JSON.stringify({
    language: 'Tamil',
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const resPost = http.post(`${baseUrl}/process`, payload, params);
  check(resPost, {
    'status is 200 or 400 (POST)': (r) => r.status === 200 || r.status === 400 || r.status === 201,
  });
  
  sleep(0.5);
}
