import { SMS_TEMPLATE_TAGS, type SmsTemplateTag } from "../sms-templates/smsTemplateTags";

export const CUSTOMER_MESSAGE_TEMPLATE_TAGS: SmsTemplateTag[] = [
  ...SMS_TEMPLATE_TAGS,
  {
    value: "{{internal_eta}}",
    label: "Internal ETA",
    description: "Internal estimated arrival date",
  },
];
