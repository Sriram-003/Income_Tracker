'use server';

import {
  suggestBillSharingContent,
  type BillSharingContentInput,
} from '@/ai/flows/bill-sharing-content-suggestion';

export async function suggestBillSharingContentAction(
  input: BillSharingContentInput
) {
  try {
    const output = await suggestBillSharingContent(input);
    return { data: output, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: 'Failed to generate content. Please try again.' };
  }
}
