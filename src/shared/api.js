// src/shared/api.js
// Smart API with enhanced data fetching and compatibility logic

const API_URL = import.meta.env.VITE_API_URL || "/api";

// =====================================================
// AUTH API
// =====================================================

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

// =====================================================
// COMPONENTS API
// =====================================================

// Fetch all components with smart fallback
export async function getComponents() {
  try {
    const res = await fetch(`${API_URL}/components`);
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      throw new Error("API unavailable");
    }
    return res.json();
  } catch (err) {
    console.warn("Using local components data:", err.message);
    const fallbackRes = await fetch("/backend_components.json");
    if (!fallbackRes.ok) throw new Error("Failed to load components");
    return fallbackRes.json();
  }
}

// Group components by category
export async function getComponentsStructured() {
  const list = await getComponents();
  const grouped = {};
  for (const c of list) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }
  return grouped;
}

// =====================================================
// SMART BUILD UTILITIES
// =====================================================

// Get lowest price from all vendors for a component
export function getLowestPrice(component) {
  if (!component?.vendors?.length) return null;
  const prices = component.vendors
    .filter(v => v.inStock && v.price > 0)
    .map(v => v.price);
  return prices.length ? Math.min(...prices) : null;
}

// Get best vendor (lowest in-stock price)
export function getBestVendor(component) {
  if (!component?.vendors?.length) return null;
  const inStock = component.vendors.filter(v => v.inStock && v.price > 0);
  if (!inStock.length) return null;
  return inStock.reduce((best, v) => v.price < best.price ? v : best);
}

// Format price in INR
export function formatPrice(amount) {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Calculate total build price
export function calculateBuildTotal(selectedComponents) {
  return Object.values(selectedComponents)
    .filter(Boolean)
    .reduce((sum, comp) => sum + (getLowestPrice(comp) || 0), 0);
}

// =====================================================
// COMPATIBILITY CHECKER
// =====================================================

export function checkCompatibility(build) {
  const warnings = [];

  // Check CPU + Motherboard socket compatibility
  if (build.cpu && build.motherboard) {
    const cpuSocket = build.cpu.socket?.toLowerCase() || '';
    const mbSocket = build.motherboard.socket?.toLowerCase() || '';
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      warnings.push({
        type: 'socket',
        severity: 'error',
        message: `CPU socket (${build.cpu.socket}) doesn't match motherboard (${build.motherboard.socket})`
      });
    }
  }

  // Check RAM + Motherboard compatibility
  if (build.ram && build.motherboard) {
    const ramType = build.ram.type?.toLowerCase() || '';
    const mbRam = build.motherboard.ramType?.toLowerCase() || '';
    if (ramType && mbRam && !mbRam.includes(ramType.replace('ddr', 'ddr'))) {
      warnings.push({
        type: 'ram',
        severity: 'warning',
        message: `RAM type (${build.ram.type}) may not be compatible with motherboard`
      });
    }
  }

  // Check PSU wattage
  if (build.psu) {
    const psuWattage = parseInt(build.psu.wattage) || 0;
    let estimatedPower = 0;
    if (build.cpu) estimatedPower += 125; // Avg CPU
    if (build.gpu) estimatedPower += 250; // Avg GPU
    estimatedPower += 100; // Other components

    if (psuWattage > 0 && psuWattage < estimatedPower * 1.2) {
      warnings.push({
        type: 'power',
        severity: 'warning',
        message: `PSU (${psuWattage}W) may be insufficient. Recommended: ${Math.ceil(estimatedPower * 1.3)}W+`
      });
    }
  }

  return {
    isCompatible: !warnings.some(w => w.severity === 'error'),
    hasWarnings: warnings.length > 0,
    warnings
  };
}

// =====================================================
// BUILD ADVISOR / RECOMMENDATIONS
// =====================================================

export async function getRecommendedBuild(budget, useCase = 'gaming', performance = 'balanced') {
  const db = await getComponentsStructured();

  // Budget allocation based on use case
  const allocations = {
    gaming: { cpu: 0.2, gpu: 0.35, motherboard: 0.12, ram: 0.1, storage: 0.08, psu: 0.08, pcCase: 0.07 },
    productivity: { cpu: 0.3, gpu: 0.2, motherboard: 0.12, ram: 0.15, storage: 0.1, psu: 0.07, pcCase: 0.06 },
    general: { cpu: 0.25, gpu: 0.25, motherboard: 0.12, ram: 0.12, storage: 0.1, psu: 0.08, pcCase: 0.08 }
  };

  const alloc = allocations[useCase] || allocations.general;
  const recommendations = {};

  // Find best component for each category within budget
  for (const [category, percentage] of Object.entries(alloc)) {
    const categoryBudget = budget * percentage;
    const components = db[category] || [];

    // Filter by price and sort by value
    const affordable = components
      .map(c => ({ ...c, lowestPrice: getLowestPrice(c) }))
      .filter(c => c.lowestPrice && c.lowestPrice <= categoryBudget * 1.15)
      .sort((a, b) => b.lowestPrice - a.lowestPrice); // Best within budget

    if (affordable.length) {
      // Pick the best component close to budget allocation
      recommendations[category] = affordable[0];
    }
  }

  return recommendations;
}

// =====================================================
// SEARCH & FILTER
// =====================================================

export function fuzzySearch(query, components) {
  if (!query) return components;

  const terms = query.toLowerCase().split(/\s+/);

  return components.filter(c => {
    const searchText = `${c.name} ${c.brand} ${c.category}`.toLowerCase();
    return terms.every(term => searchText.includes(term));
  }).sort((a, b) => {
    // Prioritize exact name matches
    const aExact = a.name.toLowerCase().includes(query.toLowerCase());
    const bExact = b.name.toLowerCase().includes(query.toLowerCase());
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
}

export function filterComponents(components, filters) {
  let result = [...components];

  if (filters.category) {
    result = result.filter(c => c.category === filters.category);
  }

  if (filters.brand) {
    result = result.filter(c => c.brand?.toLowerCase() === filters.brand.toLowerCase());
  }

  if (filters.minPrice) {
    result = result.filter(c => (getLowestPrice(c) || 0) >= filters.minPrice);
  }

  if (filters.maxPrice) {
    result = result.filter(c => {
      const price = getLowestPrice(c);
      return price && price <= filters.maxPrice;
    });
  }

  if (filters.inStock) {
    result = result.filter(c => c.vendors?.some(v => v.inStock));
  }

  return result;
}

// =====================================================
// FORUM API
// =====================================================

export async function getThreads(category) {
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_URL}/threads${qs}`);
    if (!res.ok) throw new Error('Failed to load threads');
    return res.json();
  } catch (err) {
    console.warn('Forum unavailable:', err.message);
    return []; // Return empty array on failure
  }
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

export async function getThread(id) {
  const res = await fetch(`${API_URL}/threads/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load thread');
  }
  return res.json();
}

export async function addReply({ id, content, token }) {
  const res = await fetch(`${API_URL}/threads/${id}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to post reply');
  }
  return res.json();
}

// =====================================================
// SAVED BUILDS API
// =====================================================

export async function getSavedBuilds(token) {
  try {
    const res = await fetch(`${API_URL}/saved-builds`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load saved builds');
    return res.json();
  } catch (err) {
    console.warn('Saved builds unavailable:', err.message);
    return [];
  }
}

export async function createSavedBuild({ name, items, token }) {
  const res = await fetch(`${API_URL}/saved-builds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, items })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save build');
  }
  return res.json();
}

export async function updateSavedBuild({ id, name, items, token }) {
  const res = await fetch(`${API_URL}/saved-builds/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, items })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update build');
  }
  return res.json();
}

export async function deleteSavedBuild({ id, token }) {
  const res = await fetch(`${API_URL}/saved-builds/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete build');
  }
  return res.json();
}
