import type { Client, Product, IncomeEntry } from './types';
import placeholderData from '@/lib/placeholder-images.json';

const findImage = (id: string) => {
    return placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || `https://picsum.photos/seed/${id}/100/100`;
}

export const clients: Client[] = [
  {
    id: '1',
    name: 'Amelia Johnson',
    email: 'amelia.j@example.com',
    avatarUrl: findImage('avatar-1'),
    balance: 150.75,
  },
  {
    id: '2',
    name: 'Benjamin Carter',
    email: 'ben.carter@example.com',
    avatarUrl: findImage('avatar-2'),
    balance: -320.0,
  },
  {
    id: '3',
    name: 'Olivia Martinez',
    email: 'olivia.m@example.com',
    avatarUrl: findImage('avatar-3'),
    balance: 0,
  },
  {
    id: '4',
    name: 'Liam Garcia',
    email: 'liam.g@example.com',
    avatarUrl: findImage('avatar-4'),
    balance: 50.25,
  },
  {
    id: '5',
    name: 'Sophia Rodriguez',
    email: 'sophia.r@example.com',
    avatarUrl: findImage('avatar-5'),
    balance: -85.5,
  },
];

export const products: Product[] = [
  { id: 'p1', name: 'Organic Apples', defaultPrice: 2.99, imageUrl: findImage('product-apples') },
  { id: 'p2', name: 'Whole Milk', defaultPrice: 1.5, imageUrl: findImage('product-milk') },
  { id: 'p3', name: 'Sourdough Bread', defaultPrice: 4.25, imageUrl: findImage('product-bread') },
  { id: 'p4', name: 'Free-range Eggs', defaultPrice: 3.5, imageUrl: findImage('product-eggs') },
  { id: 'p5', name: 'Almond Butter', defaultPrice: 7.0, imageUrl: findImage('product-almond-butter') },
];

export const incomeData: IncomeEntry[] = [
  { id: 'i1', amount: 35.5, date: '2023-10-01', clientName: 'Amelia Johnson', description: 'Payment for invoice #123' },
  { id: 'i2', amount: 120.0, date: '2023-10-03', clientName: 'Benjamin Carter', description: 'Weekly service fee' },
  { id: 'i3', amount: 75.0, date: '2023-10-05', clientName: 'Liam Garcia', description: 'Consultation charges' },
];

export const monthlyIncomeChartData = [
    { month: "Jan", income: 1860 },
    { month: "Feb", income: 3050 },
    { month: "Mar", income: 2370 },
    { month: "Apr", income: 730 },
    { month: "May", income: 2090 },
    { month: "Jun", income: 2140 },
    { month: "Jul", income: 2500 },
    { month: "Aug", income: 1900 },
    { month: "Sep", income: 2800 },
    { month: "Oct", income: 3200 },
    { month: "Nov", income: 2400 },
    { month: "Dec", income: 3600 },
];
