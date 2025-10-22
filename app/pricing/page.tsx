import { Navigation } from '@/components/navigation';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Pricing</h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <stripe-pricing-table 
            pricing-table-id="prctbl_1SKFjxJn2qf03jwiGD6D3xda"
            publishable-key="pk_test_51SHFo2Jn2qf03jwiSiRHerYus4RwHKd0uLeHNyHMR3D9rJ393B9tSyrDaCuk1Jowkrx1JrMD3OxfvpWBTRLjZACv007Zz3dGDY">
          </stripe-pricing-table>
        </div>
      </main>

      <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
    </div>
  );
}
