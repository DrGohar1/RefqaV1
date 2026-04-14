import api from "@/lib/api-client";

export const generateOperationId = () => {
  const date = new Date();
  const prefix = "REF";
  const timestamp =
    date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const uploadReceipt = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/upload/receipt", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
};

export const fetchCampaigns = async () => {
  const data = await api.get<any[]>("/campaigns");
  return data;
};

export const fetchSettings = async (key: string) => {
  const data = await api.get<{ value: any }>(`/settings/${key}`);
  return data?.value ?? null;
};

export const fetchDonations = async () => {
  const data = await api.get<any[]>("/donations");
  return data;
};

export const fetchUserDonations = async (userId: string) => {
  const data = await api.get<any[]>(`/donations?user_id=${userId}`);
  return data;
};

export const insertDonation = async (donation: {
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  campaign_id: string;
  campaign_title: string;
  amount: number;
  payment_method: string;
  operation_id: string;
  receipt_image_url?: string;
  user_id?: string;
}) => {
  const data = await api.post<any>("/donations", donation);
  return data;
};

export const updateDonationStatus = async (id: string, status: string) => {
  await api.patch(`/donations/${id}`, { status });
};

export const insertAuditLog = async (entry: {
  action: string;
  table_name: string;
  record_id?: string;
}) => {
  try {
    await api.post("/audit-logs", entry);
  } catch {}
};

export const insertCampaign = async (campaign: {
  title: string;
  description?: string;
  goal_amount: number;
  image_url?: string;
  category?: string;
  days_left?: number;
}) => {
  const data = await api.post<any>("/campaigns", campaign);
  return data;
};

export const updateCampaign = async (id: string, updates: Record<string, unknown>) => {
  await api.patch(`/campaigns/${id}`, updates);
};

export const deleteCampaign = async (id: string) => {
  await api.delete(`/campaigns/${id}`);
};

export const updateSettings = async (key: string, value: unknown) => {
  await api.put(`/settings/${key}`, { value, updated_at: new Date().toISOString() });
};

export const fetchPaymentMethods = async () => {
  try {
    const data = await fetchSettings("payment_methods");
    return (data as any[]) || [];
  } catch {
    return [];
  }
};

export const fetchStats = async () => {
  try {
    const data = await api.get<any>("/stats");
    return data;
  } catch {
    return { donors: 0, totalRaised: 0, campaigns: 0, beneficiaries: 0 };
  }
};
