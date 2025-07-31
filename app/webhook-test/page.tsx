import { MakeWebhookTester } from "@/components/make-webhook-tester"

export default function WebhookTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Make.com Webhook Test</h1>
      <MakeWebhookTester />
    </div>
  )
}
