export interface SmsTemplateTag {
  value: string;
  label: string;
  description: string;
}

export const SMS_TEMPLATE_TAGS: SmsTemplateTag[] = [
  {
    value: "{{customer_first_name}}",
    label: "Customer first name",
    description: "Customer's first name",
  },
  {
    value: "{{order_number}}",
    label: "Order number",
    description: "Order number",
  },
  {
    value: "{{order_status_link}}",
    label: "Order status link",
    description: "Link to view the current order status",
  },
  {
    value: "{{store_name}}",
    label: "Store name",
    description: "Store name",
  },
  {
    value: "{{tracking_number}}",
    label: "Tracking number",
    description: "Shipment tracking number",
  },
  {
    value: "{{tracking_link}}",
    label: "Tracking link",
    description: "Shipment tracking link",
  },
  {
    value: "{{support_link}}",
    label: "Support link",
    description: "Customer support link",
  },
  {
    value: "{{return_link}}",
    label: "Return link",
    description: "Product return link",
  },
  {
    value: "{{parts_lookup_link}}",
    label: "Parts lookup link",
    description: "Parts lookup link",
  },
  {
    value: "{{supplier_eta_date}}",
    label: "Supplier ETA date",
    description: "Estimated supplier arrival date",
  },
];