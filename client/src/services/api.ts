const API_BASE = '/api';

export interface VisualElement {
  id: string;
  letter_id: string | null;
  element_type: 'PROTAGONIST_FLOWER' | 'GARDEN_FLOWER' | 'STAR' | 'COSMIC_CLUSTER';
  variety: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rot_y: number;
  scale: number;
  color: string;
  birth_order: number;
  created_at: string;
  letter?: {
    id: string;
    title: string;
    category: string;
    content: string;
    sent_at?: string;
  };
}

export interface GardenState {
  totalConfirmedSent: number;
  flowerCount: number;
  starCount: number;
  stage: 'STAGE_1_FIRST_BLOOM' | 'STAGE_2_GARDEN_GROWTH' | 'STAGE_4_EARTH_ASCENT' | 'STAGE_5_COSMIC_STARS' | 'STAGE_6_UNIVERSE_OF_LOVE';
  nextMilestone: {
    target: number;
    label: string;
    remaining: number;
    progressPercent: number;
  };
}

export interface Letter {
  id: string;
  title: string;
  category: string;
  content: string;
  source?: string;
  sent_at?: string;
  created_at?: string;
  channel_used?: string;
  flower_variety?: string;
}

export interface RecipientProfile {
  name: string;
  whatsapp: string;
}

export interface RecipientStatus {
  isConfigured: boolean;
  recipientName: string;
  recipientNickname: string;
  recipientWhatsapp: string;
  hasAccessCode: boolean;
  publicWebUrl: string;
  isActive: boolean;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('eternal_bloom_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Public
  async getGardenState(): Promise<GardenState> {
    const res = await fetch(`${API_BASE}/garden/state`);
    if (!res.ok) throw new Error('Failed to load garden state');
    return res.json();
  },

  async getGardenElements(): Promise<VisualElement[]> {
    const res = await fetch(`${API_BASE}/garden/elements`);
    if (!res.ok) throw new Error('Failed to load visual elements');
    return res.json();
  },

  async getLatestLetter(): Promise<Letter> {
    const res = await fetch(`${API_BASE}/letters/latest`);
    if (!res.ok) throw new Error('Failed to load latest letter');
    return res.json();
  },

  async getHistoryLetters(): Promise<Letter[]> {
    const res = await fetch(`${API_BASE}/letters/history`);
    if (!res.ok) throw new Error('Failed to load letter history');
    return res.json();
  },

  // Recipient Auth & Experience Portal
  async getRecipientStatus(): Promise<RecipientStatus> {
    const res = await fetch(`${API_BASE}/recipient/status`);
    if (!res.ok) throw new Error('Error al consultar estado del destinatario');
    return res.json();
  },

  async accessRecipient(data: {
    name?: string;
    whatsapp: string;
    accessCode: string;
    publicWebUrl?: string;
  }): Promise<{ success: boolean; token: string; recipient: RecipientProfile; message: string }> {
    const res = await fetch(`${API_BASE}/recipient/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al iniciar sesión');
    localStorage.setItem('mve_recipient_auth', JSON.stringify({
      token: result.token,
      recipient: result.recipient
    }));
    return result;
  },

  async verifyRecipient(): Promise<{ valid: boolean; recipient?: RecipientProfile }> {
    const stored = localStorage.getItem('mve_recipient_auth');
    if (!stored) return { valid: false };
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.token) return { valid: false };
      const res = await fetch(`${API_BASE}/recipient/verify`, {
        headers: { Authorization: `Bearer ${parsed.token}` },
      });
      if (!res.ok) {
        localStorage.removeItem('mve_recipient_auth');
        return { valid: false };
      }
      return res.json();
    } catch {
      localStorage.removeItem('mve_recipient_auth');
      return { valid: false };
    }
  },

  getStoredRecipient(): RecipientProfile | null {
    const stored = localStorage.getItem('mve_recipient_auth');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed.recipient || null;
    } catch {
      return null;
    }
  },

  logoutRecipient(): void {
    localStorage.removeItem('mve_recipient_auth');
  },

  // Auth & Admin
  async login(password: string): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Credenciales inválidas');
    localStorage.setItem('eternal_bloom_token', data.token);
    return data;
  },

  logout(): void {
    localStorage.removeItem('eternal_bloom_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('eternal_bloom_token');
  },

  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al obtener configuraciones');
    return res.json();
  },

  async updateSettings(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar configuraciones');
    return res.json();
  },

  async getScheduler(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/scheduler`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al consultar programador');
    return res.json();
  },

  async triggerDailyDispatch(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/dispatch/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return res.json();
  },

  async triggerTestDispatch(channel?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/dispatch/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ channel }),
    });
    return res.json();
  },

  async getIntegrationsStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/integrations/status`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al consultar integraciones');
    return res.json();
  },

  async getLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/logs`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al consultar registros');
    return res.json();
  },

  async createManualLetter(data: { category: string; title: string; content: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al guardar carta');
    return result;
  },

  async previewSampleLetter(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/letters/preview-sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  }
};
