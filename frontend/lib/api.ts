const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export { API_BASE };

// Order interface
export interface Order {
  id: string;
  title: string;
  description?: string;
  material: string;
  color: string;
  quantity: number;
  fill_rate: number;
  status: 'submitted' | 'accepted' | 'printing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  file_name: string;
  file_size: string;
  notes?: string;
  maker?: {
    id: string;
    name: string;
    rating: number;
    completed_orders: number;
    avatar: string;
  };
}

// Node interface
export interface Node {
  id: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  build_volume: {
    x: number;
    y: number;
    z: number;
  };
  supported_materials: string[];
  location: {
    city: string;
    country: string;
  };
  status: 'online' | 'offline' | 'busy';
  description?: string;
  created_at: string;
  updated_at: string;
}

// Order API functions
export async function fetchOrders(type: 'public' | 'my' = 'public'): Promise<Order[]> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/orders?type=${type}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.orders || data;
  } catch {
    return [];
  }
}

export async function fetchOrder(id: string): Promise<Order | null> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/orders/${id}`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createOrder(data: {
  title: string;
  material: string;
  color: string;
  quantity: number;
  fill_rate: number;
  notes?: string;
  file_name: string;
  file_size: number;
}): Promise<{ success: boolean; order_id?: string; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Order creation failed' };
    }
    const result = await res.json();
    return { success: true, order_id: result.id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function updateOrderStatus(
  orderId: string, 
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { success: false, error: 'Status update failed' };
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

// Node API functions
export async function fetchNodes(): Promise<Node[]> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/nodes`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.nodes || data;
  } catch {
    return [];
  }
}

export async function registerNode(data: {
  device_type: string;
  device_brand: string;
  device_model: string;
  build_volume: {
    x: number;
    y: number;
    z: number;
  };
  supported_materials: string[];
  location: {
    city: string;
    country: string;
  };
  description?: string;
  contact_info?: string;
}): Promise<{ success: boolean; node_id?: string; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/nodes/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Node registration failed' };
    }
    const result = await res.json();
    return { success: true, node_id: result.id || result.node_id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

// Stats API function
export async function fetchStats(): Promise<{
  myNodes?: number;
  myOrders?: number;
  activeOrders?: number;
} | null> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/stats`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Community API functions
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  post_type: 'discussion' | 'request' | 'task' | 'showcase';
  author: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  upvotes: number;
  comment_count: number;
  tags: string[];
  materials?: string[];
  budget?: number;
  deadline?: string;
  images?: string[];
  files?: string[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  content: string;
  author: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  upvotes: number;
}

export async function fetchCommunityPosts(
  type?: string, 
  page = 1, 
  limit = 20
): Promise<CommunityPost[]> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && type !== '' && { type }),
    });
    
    const res = await fetch(`${API_BASE}/community/posts?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.posts || [];
  } catch {
    return [];
  }
}

export async function fetchCommunityPost(id: string): Promise<CommunityPost | null> {
  try {
    const res = await fetch(`${API_BASE}/community/posts/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPostComments(postId: string): Promise<CommunityComment[]> {
  try {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.comments || [];
  } catch {
    return [];
  }
}

export async function createCommunityPost(data: {
  title: string;
  content: string;
  post_type: 'discussion' | 'request' | 'task' | 'showcase';
  tags?: string[];
  materials?: string[];
  budget?: number;
  deadline?: string;
}): Promise<{ success: boolean; post_id?: string; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/community/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
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

export async function createComment(
  postId: string, 
  content: string
): Promise<{ success: boolean; comment_id?: string; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Comment creation failed' };
    }
    const result = await res.json();
    return { success: true, comment_id: result.id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

// Vote API functions
export async function votePost(
  postId: string,
  voteType: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/community/posts/${postId}/vote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ vote_type: voteType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Vote failed' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function voteComment(
  commentId: string,
  voteType: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/community/comments/${commentId}/vote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ vote_type: voteType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Vote failed' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}