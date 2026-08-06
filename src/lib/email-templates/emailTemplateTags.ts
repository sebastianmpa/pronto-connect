export interface EmailTemplateTag {
  value: string;
  label: string;
  description: string;
}

/**
 * Placeholders currently supported by the email/SMS template flow.
 * Keep the exact value because the backend replaces these tokens at send time.
 */
export const EMAIL_TEMPLATE_TAGS: EmailTemplateTag[] = [
  {
    value: "{{customer_first_name}}",
    label: "Customer first name",
    description: "Customer first name.",
  },
  {
    value: "{{order_number}}",
    label: "Order number",
    description: "Customer order number.",
  },
  {
    value: "{{carrier}}",
    label: "Carrier",
    description: "Shipping carrier name.",
  },
  {
    value: "{{storeurl}}",
    label: "Store URL",
    description: "Base URL of the customer store.",
  },
  {
    value: "{{order-status}}",
    label: "Order status",
    description: "Order status path or URL fragment.",
  },
  {
    value: "{{store}}",
    label: "Store name",
    description: "Visible store name.",
  },
];
