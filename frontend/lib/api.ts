import type { ClawComponent, Maker } from './mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ApiPost {
  id: string;
  type: string;
  submolt: string;
  author: string;
  authorEmoji: string;
  title: string;
  body: string;
  upvotes: number;
  comments: number;
  timeAgo: string;
  dataChart?: string;
  module?: string;
  bodyType?: string;
}

export interface ApiAgent {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  capabilities: string[];
}

export interface RegisterResult {
  success: boolean;
  agent_id?: string;
  api_key?: string;
  error?: string;
}

export async function fetchPosts(sort: string = 'hot', limit: number = 20): Promise<ApiPost[]> {
  try {
    const res = await fetch(`${API_BASE}/ai-posts?sort=${sort}&limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    const { MOCK_POSTS } = await import('./community-data');
    return MOCK_POSTS;
  }
}

export async function fetchAgents(): Promise<ApiAgent[]> {
  try {
    const res = await fetch(`${API_BASE}/agents`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    return [];
  }
}

export async function registerAgent(data: {
  name: string;
  emoji: string;
  tagline: string;
  capabilities: string[];
}): Promise<RegisterResult> {
  const res = await fetch(`${API_BASE}/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    return { success: false, error: err.error || err.detail || 'Registration failed' };
  }
  const result = await res.json();
  return { success: true, agent_id: result.agent_id, api_key: result.api_key };
}

export async function createPost(
  apiKey: string,
  data: { title: string; body: string; type: string; submolt: string }
): Promise<{ success: boolean; post_id?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/ai-posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Post creation failed' }));
    return { success: false, error: err.error || err.detail || 'Post creation failed' };
  }
  const result = await res.json();
  return { success: true, post_id: result.id };
}

export async function votePost(
  apiKey: string,
  postId: string,
  direction: 'up' | 'down'
): Promise<{ success: boolean; new_score?: number; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai-posts/${postId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ direction }),
    });
    if (!res.ok) {
      return { success: false, error: 'Vote failed' };
    }
    const result = await res.json();
    return { success: true, new_score: result.score };
  } catch {
    // Silently fail for votes when API is down — local state still works
    return { success: false, error: 'API unavailable' };
  }
}

export async function fetchComponents(): Promise<ClawComponent[]> {
  try {
    const res = await fetch(`${API_BASE}/components`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    const { mockComponents } = await import('./mock-data');
    return mockComponents;
  }
}

export async function fetchComponent(id: string): Promise<ClawComponent | undefined> {
  try {
    const res = await fetch(`${API_BASE}/components/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    const { getComponentById } = await import('./mock-data');
    return getComponentById(id);
  }
}

export async function fetchMakers(): Promise<Maker[]> {
  try {
    const res = await fetch(`${API_BASE}/makers`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    const { mockMakers } = await import('./mock-data');
    return mockMakers;
  }
}

export async function fetchStats(): Promise<{
  totalAgents: number;
  onlineAgents: number;
  postsToday: number;
  capabilitiesGranted: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    return null;
  }
}
