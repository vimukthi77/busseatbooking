import WebhookDebugDashboard from '@/components/WebhookDebugDashboard';

export const metadata = {
  title: 'Webhook Debug Dashboard',
  description: 'Monitor and debug webhook payments',
};

export default function WebhookDebugPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <WebhookDebugDashboard />
    </div>
  );
}
