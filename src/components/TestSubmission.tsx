import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TestSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    console.log('Testing Supabase submission with data:', data);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/form_submissions`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          form_id: 'test_form_' + Date.now(),
          form_title: 'Test Submission Form',
          data: data,
          utm_params: null,
          submitted_at: new Date().toISOString()
        })
      });

      console.log('Supabase response status:', response.status);

      if (response.ok) {
        setResult({
          type: 'success',
          message: '✅ SUCCESS: Form submission saved to Supabase! Check the form_submissions table in your Supabase dashboard.'
        });
      } else {
        const errorText = await response.text();
        console.error('Supabase error:', errorText);
        setResult({
          type: 'error',
          message: `❌ ERROR: Submission failed (${response.status}) - ${errorText}`
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      setResult({
        type: 'error',
        message: `❌ NETWORK ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Form Submissions to Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                type="text" 
                id="firstName" 
                name="firstName" 
                required 
                placeholder="John"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                type="email" 
                id="email" 
                name="email" 
                required 
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input 
                type="tel" 
                id="phone" 
                name="phone" 
                placeholder="+1234567890"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Test Supabase Submission'}
            </Button>
          </form>

          {result && (
            <Alert className={`mt-4 ${result.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}