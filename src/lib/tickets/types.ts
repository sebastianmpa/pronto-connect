// ─── Query params ─────────────────────────────────────────────────────────────

export interface TicketsParams {
  page?: number;
  limit?: number;
  email?: string;
  phone?: string;
}

// ─── Shared refs ───────────────────────────────────────────────────────────────

export interface TicketCustomerRef {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  account?: string | null;
}

export interface TicketAssignee {
  id: string;
  name: string;
  email: string;
}

export interface TicketDepartment {
  id: string;
  name: string;
}

// ─── Single ticket (list item) ─────────────────────────────────────────────────

export interface TicketItem {
  id: string;
  ticketNumber: string | null;
  subject: string | null;
  status: string | null;
  statusType: string | null;
  priority: string | null;
  channel: string | null;
  createdTime: string | null;
  modifiedTime: string | null;
  dueDate: string | null;
  webUrl: string | null;
  customer: TicketCustomerRef;
  assignee: TicketAssignee | null;
  department: TicketDepartment | null;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface TicketsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: TicketItem[];
}

// ─── Ticket detail ──────────────────────────────────────────────────────────────

export interface TicketCounts {
  threads: number;
  comments: number;
  attachments: number;
  tasks: number;
  timeEntries: number;
  followers: number;
  approvals: number;
}

export interface TicketDetail extends TicketItem {
  description: string | null;
  resolution: string | null;
  category: string | null;
  subCategory: string | null;
  classification: string | null;
  language: string | null;
  responseDueDate: string | null;
  customerResponseTime: string | null;
  closedTime: string | null;
  onholdTime: string | null;
  isRead: boolean;
  isOverDue: boolean;
  isEscalated: boolean;
  isSpam: boolean;
  team: string | null;
  product: string | null;
  customFields: Record<string, unknown>;
  counts: TicketCounts;
}
