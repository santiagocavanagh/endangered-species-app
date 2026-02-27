// Login as regular user and add species id 1 to favorites, then fetch favorites
(async () => {
  try {
    const base = 'http://localhost:3000';

    const loginResp = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test+cli@example.com', password: 'password123' }),
    });

    const loginJson = await loginResp.json();
    if (!loginJson.token) {
      console.error('Login failed', loginJson);
      process.exit(1);
    }

    const token = loginJson.token;
    console.log('User token (truncated):', token ? token.slice(0, 40) + '...' : token);

    const addResp = await fetch(`${base}/api/favorites/1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const addJson = await addResp.json();
    console.log('Add favorite status', addResp.status, addJson);

    const listResp = await fetch(`${base}/api/favorites`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const listJson = await listResp.json();
    console.log('Favorites list status', listResp.status, listJson);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
