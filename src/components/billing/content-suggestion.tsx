'use client';

import { useState, useActionState } from 'react';
import { Wand2, Copy } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { suggestBillSharingContentAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type ContentSuggestionProps = {
  clientName: string;
  pastBalance: number;
  currentBalance: number;
  billAmount: number;
};

type ActionState = {
  data: { suggestedContent: string } | null;
  error: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        'Generating...'
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" /> Suggest with AI
        </>
      )}
    </Button>
  );
}

export function ContentSuggestion({
  clientName,
  pastBalance,
  currentBalance,
  billAmount,
}: ContentSuggestionProps) {
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState<string>('');

  const actionWithInput = suggestBillSharingContentAction.bind(null, {
    accountPersonName: clientName,
    pastBalance,
    currentBalance,
    billAmount,
  });

  const [state, formAction] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await actionWithInput();
      if (result.data) {
        setSuggestion(result.data.suggestedContent);
      }
      return result;
    },
    { data: null, error: null }
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    toast({
      title: 'Copied to clipboard!',
      description: 'The suggested message has been copied.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Content Suggester</CardTitle>
        <CardDescription>
          Generate a professional message to share with your client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suggested-content">Suggested Message</Label>
            <Textarea
              id="suggested-content"
              placeholder="Click 'Suggest with AI' to generate a message."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={5}
              className="bg-background"
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <SubmitButton />
            {suggestion && (
              <Button
                variant="outline"
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Text
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
