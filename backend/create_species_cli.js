// Simple Node script to login as admin and create a species via API
(async () => {
  try {
    const base = 'http://localhost:3000';

    const loginResp = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin+cli@example.com', password: 'adminpass123' }),
    });

    const loginJson = await loginResp.json();
    if (!loginJson.token) {
      console.error('Login failed', loginJson);
      process.exit(1);
    }

    const token = loginJson.token;
    console.log('Got token (truncated):', token ? token.slice(0, 40) + '...' : token);

    const createResp = await fetch(`${base}/api/species`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        scientificName: 'Panthera leo test',
        commonName: 'Lion Test',
        iucnStatus: 'VU',
        taxonomyId: 1,
        description: 'Test species',
        habitat: 'Savannah',
        regionIds: [1],
      }),
    });

    const createJson = await createResp.json();
    console.log('Create status', createResp.status, createJson);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
