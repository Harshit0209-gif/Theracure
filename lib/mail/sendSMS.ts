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

  const res = await fetch("https://control.msg91.com/api/v5/flow", {
    method: "POST",
    headers: {
      accept: "application/json",
      authkey: process.env.MSG91_AUTH_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}
