// src/shared/api.js

const API_URL = import.meta.env.VITE_API_URL || "/api";

// ✅ Register new user
export async function register(username, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Registration failed");
  }

  return res.json();
}

// ✅ Login existing user
export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Invalid credentials");
  }

  return res.json();
}

// ✅ Fetch all components with fallback to local JSON
export async function getComponents() {
  try {
    const res = await fetch(`${API_URL}/components`);
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  } catch (err) {
    // Fallback to local components JSON when API is unavailable
    console.warn("API unavailable, loading local components data...");
    const fallbackRes = await fetch("/backend_components.json");
    if (!fallbackRes.ok) throw new Error("Failed to load components");
    return fallbackRes.json();
  }
}

// Group list of components by category to mirror the old componentsDB shape
export async function getComponentsStructured() {
  const list = await getComponents();
  const grouped = {};
  for (const c of list) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }
  return grouped;
}

// ===== Forum API =====
export async function getThreads(category) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${API_URL}/threads${qs}`);
  if (!res.ok) throw new Error('Failed to load threads');
  return res.json();
}

export async function createThread({ title, category = 'General', content, token }) {
  const res = await fetch(`${API_URL}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, category, content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create thread');
  }
  return res.json();
}

export async function deleteThread({ id, token }) {
  const res = await fetch(`${API_URL}/threads/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete thread');
  }
  return res.json();
}

// Thread details and replies
export async function getThread(id) {
  const res = await fetch(`${API_URL}/threads/${id}`)
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to load thread') }
  return res.json()
}

export async function addReply({ id, content, token }) {
  const res = await fetch(`${API_URL}/threads/${id}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content })
  })
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to post reply') }
  return res.json()
}

// ===== Saved Builds API =====
export async function getSavedBuilds(token) {
  const res = await fetch(`${API_URL}/saved-builds`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Failed to load saved builds')
  return res.json()
}

export async function createSavedBuild({ name, items, token }) {
  const res = await fetch(`${API_URL}/saved-builds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, items })
  })
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to save build') }
  return res.json()
}

export async function updateSavedBuild({ id, name, items, token }) {
  const res = await fetch(`${API_URL}/saved-builds/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, items })
  })
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update build') }
  return res.json()
}

export async function deleteSavedBuild({ id, token }) {
  const res = await fetch(`${API_URL}/saved-builds/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete build') }
  return res.json()
}
