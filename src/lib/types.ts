export type Client = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  balance: number;
};

export type Product = {
  id: string;
  name: string;
  defaultPrice: number;
  unit: 'item' | 'kg' | 'g' | 'litre' | 'ml';
};

export type BillItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type Bill = {
  id: string;
  clientId: string;
  items: BillItem[];
  totalAmount: number;
  date: string;
  previousBalance: number;
  newBalance: number;
};

export type IncomeEntry = {
  id: string;
  amount: number;
  date: string;
  clientName: string;
  description: string;
};
