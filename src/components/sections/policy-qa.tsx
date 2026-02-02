'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { askQuestion } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialState = {
  answer: '',
  error: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="icon" disabled={pending} aria-disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      <span className="sr-only">Submit Question</span>
    </Button>
  );
}

export function PolicyQA() {
  const [state, formAction] = useFormState(askQuestion, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.answer || state.error) {
      answerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if(state.answer){
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section id="policies" className="w-full bg-secondary py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">
            AI-Powered Q&A
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Ask About Her Policies
          </h2>
          <p className="text-muted-foreground md:text-xl/relaxed">
            Have a question about Dr. Monisha Chakraborty's stance on an issue? Use our AI assistant to get an answer based on her public statements.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Card>
            <form ref={formRef} action={formAction}>
              <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
                <CardDescription>
                  Type your question below and our AI will provide an answer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Textarea
                    name="question"
                    placeholder="e.g., What is her plan for improving healthcare in Barishal?"
                    className="min-h-[100px] resize-none pr-14"
                    required
                  />
                  <div className="absolute bottom-2 right-2">
                    <SubmitButton />
                  </div>
                </div>
              </CardContent>
            </form>
            {(state?.answer || state?.error) && (
              <CardFooter ref={answerRef}>
                {state.error && (
                   <Alert variant="destructive">
                     <AlertTitle>Error</AlertTitle>
                     <AlertDescription>{state.error}</AlertDescription>
                   </Alert>
                )}
                {state.answer && (
                  <Alert>
                    <AlertTitle className="font-headline">Answer</AlertTitle>
                    <AlertDescription>{state.answer}</AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
