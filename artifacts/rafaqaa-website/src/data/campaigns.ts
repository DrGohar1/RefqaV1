export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  goalAmount: number;
  raisedAmount: number;
  daysLeft: number;
  donorsCount: number;
  image: string;
  icon: string;
}

export const campaigns: Campaign[] = [
  {
    id: "1",
    title: "تبرع بزكاتك وصدقاتك",
    description: "طهّر مالك وبارك فيه بإخراج زكاتك وصدقاتك لمستحقيها",
    category: "زكاة",
    goalAmount: 500000,
    raisedAmount: 342000,
    daysLeft: 30,
    donorsCount: 245,
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80",
    icon: "coins",
  },
  {
    id: "2",
    title: "كفالة اليتيم",
    description: "كن رفيق النبي ﷺ في الجنة بكفالة يتيم",
    category: "أيتام",
    goalAmount: 300000,
    raisedAmount: 178000,
    daysLeft: 45,
    donorsCount: 189,
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80",
    icon: "heart-handshake",
  },
  {
    id: "3",
    title: "إطعام الطعام للمساكين والفقراء",
    description: "أطعمهم ممّا رزقك الله، فاللقمة تفك كربة",
    category: "إطعام",
    goalAmount: 200000,
    raisedAmount: 156000,
    daysLeft: 20,
    donorsCount: 312,
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&q=80",
    icon: "utensils",
  },
  {
    id: "4",
    title: "الخدمات الطبية والرعاية الصحية",
    description: "ساهم في شفاء مريض ورسم البسمة على وجهه",
    category: "صحة",
    goalAmount: 400000,
    raisedAmount: 89000,
    daysLeft: 60,
    donorsCount: 98,
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80",
    icon: "stethoscope",
  },
  {
    id: "5",
    title: "المساعدات الاجتماعية وإغاثة الأسر",
    description: "ارفع المعاناة عن أسر تعفّفت عن السؤال",
    category: "إغاثة",
    goalAmount: 250000,
    raisedAmount: 201000,
    daysLeft: 15,
    donorsCount: 275,
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80",
    icon: "home",
  },
  {
    id: "6",
    title: "بناء وترميم المساجد",
    description: "من بنى لله مسجداً بنى الله له بيتاً في الجنة",
    category: "مساجد",
    goalAmount: 800000,
    raisedAmount: 520000,
    daysLeft: 90,
    donorsCount: 430,
    image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80",
    icon: "building",
  },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
};
