export const trustedOrigins =
  process.env.NODE_ENV === 'production'
    ? [
        'https://lin.ky',
        'https://www.lin.ky',
        'https://admin.lin.ky',
        'https://glow.as',
        'https://www.glow.as',
        'https://admin.glow.as',
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3004',
      ];
