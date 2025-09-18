type DodoUsageEvent = {
  event_id: string;
  customer_id: string;
  event_name: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

/**
 * Send usage events to Dodo Payments. Non-blocking; logs on failure.
 * Docs: https://docs.dodopayments.com/developer-resources/usage-based-billing-guide#sending-usage-events
 */
export async function sendUsageEvents(events: DodoUsageEvent[]): Promise<void> {
  const apiKey = process.env.DODO_API_KEY || process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    console.warn('Dodo API key missing; skipping usage event dispatch');
    return;
  }

  try {
    const res = await fetch('https://test.dodopayments.com/events/ingest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Dodo usage events failed', res.status, text);
    }
  } catch (err) {
    console.error('Dodo usage events error', err);
  }
}


