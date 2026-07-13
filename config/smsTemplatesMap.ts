export const TEMPLATE_MAP = {
  APPOINTMENT_CONFIRMATION: "6a29778bd4c2a8e2c10d3c42",
  APPOINTMENT_CANCELLED: "6a2978aa176b55c4820eb892",
  APPOINTMENT_RESCHEDULED: "6a29782818bb61cc460484a5",
  INVOICE_NOTIFICATION: "6910da3edbbbaf3cf91bd4e7",
  FEEDBACK_REQUEST: "690f09b8f6cd8549bf0ab4e5",
};

export type TemplateKey = keyof typeof TEMPLATE_MAP;

export const getTemplateId = (key: TemplateKey): string => {
  return TEMPLATE_MAP[key];
};
