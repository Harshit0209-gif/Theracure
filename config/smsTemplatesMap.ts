export const TEMPLATE_MAP = {
  APPOINTMENT_CONFIRMATION: "6910daf5e40de569b4591799",
  APPOINTMENT_CANCELLED: "6910db6b7e51602b465a5748",
  APPOINTMENT_RESCHEDULED: "6910dc47a3f16f3cac36d616",
  INVOICE_NOTIFICATION: "6910da3edbbbaf3cf91bd4e7",
  FEEDBACK_REQUEST: "690f09b8f6cd8549bf0ab4e5",
};

export type TemplateKey = keyof typeof TEMPLATE_MAP;

export const getTemplateId = (key: TemplateKey): string => {
  return TEMPLATE_MAP[key];
};
