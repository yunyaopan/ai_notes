import { Navigation } from "@/components/navigation";

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navigation />
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="w-full max-w-4xl space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Terms and Conditions</h1>
              <p className="text-lg text-muted-foreground">
                Last updated: 24 Sep 2025
              </p>
              
            </div>

            <div className="prose prose-lg max-w-none space-y-8">
              <p className="text-lg">
                By accessing or using our services, you agree to the following terms and conditions. Please read them carefully.
              </p>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using the website and its services (collectively, the "Service"), you agree to comply with and be bound by these Terms and Conditions, our Privacy Policy, and any other guidelines or rules that may apply to specific features or services of the app. If you do not agree with these terms, do not use the Service.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">2. Account Registration</h2>
                <p>To use certain features of the Service, you may be required to create an account. You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information during the registration process.</li>
                  <li>Maintain the confidentiality of your account information, including your username and password.</li>
                  <li>Notify us immediately of any unauthorized use of your account.</li>
                </ul>
                <p>You are responsible for all activities under your account, and we are not liable for any loss or damage resulting from your failure to protect your account.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">3. Use of Service</h2>
                <p>You agree to use the Service only for lawful purposes and in accordance with these Terms and Conditions. You may not:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Service to create or store content that is illegal, harmful, defamatory, or violates the rights of others.</li>
                  <li>Attempt to gain unauthorized access to our systems or networks.</li>
                  <li>Interfere with the functioning of the Service or other users' experience.</li>
                </ul>
                <p>We reserve the right to suspend or terminate your account if you violate these terms.</p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">4. Privacy and Data Collection</h2>
                <p>
                  We value your privacy. Your use of the Service is also governed by our [Privacy Policy]. Please review it to understand how we collect, use, and protect your data.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
                <p>
                  All content and materials available through the Service, including the design, text, graphics, and software, are the property of [App Name] or its licensors and are protected by copyright, trademark, and other intellectual property laws. You may not use, reproduce, or distribute any materials from the Service without prior written consent, except for personal, non-commercial use.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">6. Content Ownership</h2>
                <p>
                  You retain ownership of all notes, documents, and other content that you upload or create through the Service ("Your Content"). However, by using the Service, you grant us a worldwide, non-exclusive, royalty-free license to store, display, and process Your Content solely for the purpose of providing the Service to you.
                </p>
                <p>
                  You are solely responsible for the content you upload and must ensure that it does not infringe the rights of third parties.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">7. Subscription and Payment</h2>
                <p>
                  Some features of the Service may require a paid subscription. You agree to provide accurate billing information and authorize us to charge you for the subscription fees. Subscription fees are non-refundable unless otherwise stated.
                </p>
                <p>
                  If you cancel your subscription, you will still have access to premium features until the end of your billing cycle.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">8. Termination</h2>
                <p>
                  We may suspend or terminate your account and access to the Service at any time, with or without cause, if we believe that you have violated these Terms and Conditions. Upon termination, your right to use the Service will immediately cease.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">9. Disclaimer of Warranties</h2>
                <p>
                  The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be error-free, uninterrupted, or secure.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">10. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, [App Name] will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising from your use of or inability to use the Service.
                </p>
              </section>


              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">11. Modifications</h2>
                <p>
                  We may update or modify these Terms and Conditions at any time. We will notify users of any material changes by posting the updated terms on this page. Your continued use of the Service after such changes will constitute your acceptance of the new terms.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
