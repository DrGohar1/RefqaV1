export type PaymentMethod = "vodafone_cash" | "bank_transfer" | "instapay";

export interface PaymentMethodInfo {
  id: PaymentMethod;
  label: string;
  icon: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
}

export const paymentMethods: PaymentMethodInfo[] = [
  {
    id: "vodafone_cash",
    label: "فودافون كاش",
    icon: "smartphone",
    accountNumber: "01130925036",
    accountName: "مؤسسة رفقاء البررة",
    instructions: "قم بتحويل المبلغ عبر فودافون كاش ثم ارفع صورة الإيصال",
  },
  {
    id: "bank_transfer",
    label: "تحويل بنكي",
    icon: "building-2",
    accountNumber: "EG123456789012345678901234",
    accountName: "مؤسسة رفقاء البررة للتنمية",
    instructions: "حوّل إلى الحساب البنكي ثم ارفع إيصال التحويل",
  },
  {
    id: "instapay",
    label: "انستاباي",
    icon: "zap",
    accountNumber: "01130925036",
    accountName: "مؤسسة رفقاء البررة",
    instructions: "استخدم انستاباي لتحويل المبلغ ثم ارفع لقطة شاشة",
  },
];

export type DonationStatus = "pending" | "approved" | "rejected";

export interface Donation {
  id: string;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  paymentMethod: PaymentMethod;
  proofImage?: string;
  status: DonationStatus;
  createdAt: string;
  note?: string;
}

// Local storage mock for donations
const STORAGE_KEY = "refaq_donations";

export const saveDonation = (donation: Omit<Donation, "id" | "createdAt" | "status">): Donation => {
  const newDonation: Donation = {
    ...donation,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const existing = getDonations();
  existing.push(newDonation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return newDonation;
};

export const getDonations = (): Donation[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const updateDonationStatus = (id: string, status: DonationStatus): void => {
  const donations = getDonations();
  const idx = donations.findIndex((d) => d.id === id);
  if (idx !== -1) {
    donations[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
  }
};
