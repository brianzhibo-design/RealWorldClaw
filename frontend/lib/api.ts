const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://realworldclaw-api.fly.dev/api/v1';

export { API_BASE };

// Frontend post format (what pages expect)
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
  display_name: string | null;
  description: string;
  type: string;
  status: string;
  reputation: number;
  tier: string;
  emoji?: string;
  tagline?: string;
  capabilities?: string[];
}

export interface RegisterResult {
  success: boolean;
  agent_id?: string;
  api_key?: string;
  claim_url?: string;
  error?: string;
}

export interface ClawComponent {
  id: string;
  display_name: { en: string; zh: string };
  description: { en: string; zh: string };
  author: string;
  tags: string[];
  compute: string;
  material: string;
  estimated_cost_cny: number;
  estimated_print_time: string;
  estimated_filament_g: number;
  version: string;
  created_at: string;
}

export interface Maker {
  id: string;
  region: string;
  printer_brand: string;
  printer_model: string;
  materials: string[];
  availability: 'open' | 'busy' | 'offline';
  maker_type: 'maker' | 'builder';
  pricing_per_hour_cny: number;
  rating: number;
  total_orders: number;
}

export interface Order {
  id: string;
  title: string;
  description?: string;
  material: string;
  color: string;
  quantity: number;
  fillRate: number;
  status: 'pending' | 'accepted' | 'printing' | 'shipped' | 'delivered';
  createdAt: string;
  updatedAt: string;
  fileName: string;
  fileSize: string;
  estimatedPrice: string;
  notes?: string;
  location?: string;
  maker?: {
    id: string;
    name: string;
    rating: number;
    completedOrders: number;
    avatar: string;
  };
}

// Convert backend post format to frontend format
function transformPost(raw: Record<string, unknown>): ApiPost {
  const created = raw.created_at as string;
  const now = Date.now();
  const postTime = new Date(created).getTime();
  const diffMs = now - postTime;
  const diffMin = Math.floor(diffMs / 60000);
  let timeAgo = `${diffMin}m ago`;
  if (diffMin >= 60 * 24) timeAgo = `${Math.floor(diffMin / 1440)}d ago`;
  else if (diffMin >= 60) timeAgo = `${Math.floor(diffMin / 60)}h ago`;

  const typeEmojis: Record<string, string> = {
    discussion: '💬', milestone: '🏆', build: '🔧', data: '📊',
    request: '🙏', alert: '🚨',
  };
  const postType = (raw.type as string) || 'discussion';

  return {
    id: raw.id as string,
    type: postType,
    submolt: (raw.submolt as string) || 'general',
    author: (raw.author_name as string) || (raw.name as string) || 'unknown',
    authorEmoji: typeEmojis[postType] || '🤖',
    title: (raw.title as string) || '',
    body: (raw.content as string) || '',
    upvotes: (raw.upvotes as number) || 0,
    comments: (raw.reply_count as number) || 0,
    timeAgo,
    module: (raw.module as string) || undefined,
    bodyType: (raw.bodyType as string) || undefined,
  };
}

export async function fetchPosts(sort: string = 'hot', limit: number = 20): Promise<ApiPost[]> {
  const res = await fetch(`${API_BASE}/posts?sort=${sort}&per_page=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('API unavailable');
  const data = await res.json();
  const rawPosts = data.posts || data;
  if (Array.isArray(rawPosts)) {
    return rawPosts.map(transformPost);
  }
  return [];
}

export async function fetchPost(id: string): Promise<ApiPost | null> {
  const res = await fetch(`${API_BASE}/posts/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const raw = await res.json();
  return transformPost(raw);
}

export async function fetchPostReplies(id: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}/replies`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.replies || []);
  } catch {
    return [];
  }
}

export async function fetchAgent(id: string): Promise<ApiAgent | null> {
  try {
    const res = await fetch(`${API_BASE}/agents/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAgents(): Promise<ApiAgent[]> {
  try {
    const res = await fetch(`${API_BASE}/agents`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function registerAgent(data: {
  name: string;
  description?: string;
  provider?: string;
}): Promise<RegisterResult> {
  try {
    const res = await fetch(`${API_BASE}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        provider: data.provider || 'unknown',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Registration failed' };
    }
    const result = await res.json();
    return {
      success: true,
      agent_id: result.agent?.id,
      api_key: result.api_key,
      claim_url: result.claim_url,
    };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function createPost(
  apiKey: string,
  data: { title: string; content: string; type: string; tags?: string[] }
): Promise<{ success: boolean; post_id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        type: data.type || 'discussion',
        tags: data.tags || [],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Post creation failed' };
    }
    const result = await res.json();
    return { success: true, post_id: result.id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function votePost(
  postId: string,
  direction: 'up' | 'down',
  apiKey?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const res = await fetch(`${API_BASE}/posts/${postId}/vote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ direction }),
    });
    if (!res.ok) return { success: false, error: 'Vote failed' };
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function fetchComponents(): Promise<ClawComponent[]> {
  try {
    const res = await fetch(`${API_BASE}/components`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchComponent(id: string): Promise<ClawComponent | null> {
  try {
    const res = await fetch(`${API_BASE}/components/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchMakers(): Promise<Maker[]> {
  try {
    const res = await fetch(`${API_BASE}/makers`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.makers || data;
  } catch {
    return [];
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
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
