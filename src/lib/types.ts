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
  description?: string;
  defaultPrice: number;
  imageUrl?: string;
};

export type ClientProductPrice = {
  id: string;
  clientId: string;
  productId: string;
  price: number;
}

export type BillItem = {
  productId: string;
  productName: string; // Used for temp products
  quantity: number;
  price: number;
  isTemp: boolean;
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
  clientId: string;
  amount: number;
  date: string;
  clientName?: string; // Optional, can be joined
  description: string;
  entryDate: string;
  createdAt: any;
};
