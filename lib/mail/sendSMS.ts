type SendSMSFlowParams = {
  templateId: string;
  mobiles: string | string[];
  variables: Record<string, string>;
};

export async function sendSMSFlow({
  templateId,
  mobiles,
  variables,
}: SendSMSFlowParams): Promise<any> {
  const hasUrl = Object.values(variables).some((value) =>
    /^https?:\/\/.+/.test(value)
  );

  const payload = {
    template_id: templateId,
    short_url: hasUrl ? "1" : "0",
    short_url_expiry: hasUrl ? process.env.URL_EXPIRY_SECONDS : "0",
    realTimeResponse: "0",
    recipients: [
      {
        mobiles,
        ...variables,
      },
    ],
  };

  console.log("📤 MSG91 API Request:", JSON.stringify(payload, null, 2));

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST",
      headers: {
        accept: "application/json",
        authkey: process.env.MSG91_AUTH_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`MSG91 API returned status ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error("❌ MSG91 API request timed out after 10 seconds");
      throw new Error("SMS API request timed out");
    }

    // Handle network errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error("❌ Network error connecting to MSG91:", error.message);
      throw new Error(`Network error: ${error.message}`);
    }

    // Re-throw other errors
    console.error("❌ Error sending SMS:", error);
    throw error;
  }
}
