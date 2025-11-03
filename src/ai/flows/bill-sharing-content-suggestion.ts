'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting text content for sharing a bill image.
 *
 * It includes:
 * - `suggestBillSharingContent`: An async function that takes bill details and returns a suggested sharing message.
 * - `BillSharingContentInput`: The input type for the `suggestBillSharingContent` function.
 * - `BillSharingContentOutput`: The output type for the `suggestBillSharingContent` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BillSharingContentInputSchema = z.object({
  accountPersonName: z.string().describe('The name of the person associated with the account.'),
  pastBalance: z.number().describe('The past balance of the account.'),
  currentBalance: z.number().describe('The current balance of the account.'),
  billAmount: z.number().describe('The amount of the current bill.'),
});

export type BillSharingContentInput = z.infer<typeof BillSharingContentInputSchema>;

const BillSharingContentOutputSchema = z.object({
  suggestedContent: z.string().describe('The AI-suggested text content for sharing the bill image.'),
});

export type BillSharingContentOutput = z.infer<typeof BillSharingContentOutputSchema>;

export async function suggestBillSharingContent(
  input: BillSharingContentInput
): Promise<BillSharingContentOutput> {
  return billSharingContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'billSharingContentPrompt',
  input: {schema: BillSharingContentInputSchema},
  output: {schema: BillSharingContentOutputSchema},
  prompt: `You are an AI assistant designed to suggest text content for sharing a bill image with a client.

  Based on the following bill details, generate a concise and professional message to share with the client:

  Account Person Name: {{{accountPersonName}}}
  Past Balance: {{{pastBalance}}}
  Current Bill Amount: {{{billAmount}}}
  New Balance: {{{currentBalance}}}

  The message should include a greeting, a summary of the bill, and a call to action (e.g., payment).
  Keep the message under 200 characters.
  Do not include any promotional or marketing content.
  Start with "Dear {{{accountPersonName}}}".

  Suggested Content:`,
});

const billSharingContentFlow = ai.defineFlow(
  {
    name: 'billSharingContentFlow',
    inputSchema: BillSharingContentInputSchema,
    outputSchema: BillSharingContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
