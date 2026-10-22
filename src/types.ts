// Domain models used throughout the UI.
// Each one maps to a Dataverse table; the mapping lives in services/dataverseService.ts
// so the UI never depends on Dataverse column names.

export type Priority = 'low' | 'normal' | 'high';

/** Custom table: pp_notification */
export interface Notification {
  id: string;
  title: string;
  body: string;
  category: 'announcement' | 'action' | 'system';
  priority: Priority;
  createdOn: string; // ISO date
  read: boolean;
}

/** Custom table: pp_message (one row per message, grouped by threadId) */
export interface Message {
  id: string;
  threadId: string;
  subject: string;
  body: string;
  fromName: string;
  fromRole: string;
  fromManagement: boolean;
  sentOn: string;
  read: boolean;
}

export interface MessageThread {
  threadId: string;
  subject: string;
  messages: Message[];
  lastSentOn: string;
  unread: number;
}

/** Standard table: annotation (note with attachment), regarding an account */
export interface PortalDocument {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: DocumentCategory;
  description: string;
  uploadedBy: string;
  uploadedOn: string;
  accountId?: string;
}

export type DocumentCategory = 'Contract' | 'Compliance' | 'Invoice' | 'Report' | 'Other';

/** Standard table: account */
export interface Account {
  id: string;
  name: string;
  industry: string;
  city: string;
  phone: string;
  website: string;
  status: 'active' | 'inactive';
  primaryContactId?: string;
  modifiedOn: string;
}

/** Standard table: contact */
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  accountId?: string;
}

export type OpportunityStage = 'Qualify' | 'Develop' | 'Propose' | 'Close';

/** Standard table: opportunity */
export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  estimatedValue: number;
  stage: OpportunityStage;
  probability: number;
  estimatedCloseDate: string;
}

/** Standard table: task (activity), regarding an account */
export interface Activity {
  id: string;
  subject: string;
  accountId: string;
  dueDate: string;
  completed: boolean;
}

export type NewDocument = Omit<PortalDocument, 'id' | 'uploadedOn' | 'uploadedBy'> & { file: File };
export type NewAccount = Omit<Account, 'id' | 'modifiedOn'>;
export type NewContact = Omit<Contact, 'id'>;
export type NewOpportunity = Omit<Opportunity, 'id'>;
