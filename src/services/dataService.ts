import type {
  Account,
  Activity,
  Contact,
  Message,
  NewAccount,
  NewContact,
  NewDocument,
  NewOpportunity,
  Notification,
  Opportunity,
  PortalDocument,
} from '../types';

/**
 * Everything the portal reads or writes goes through this interface.
 * MockDataService implements it with in-memory dummy data today;
 * DataverseDataService implements it against the Dataverse Web API.
 */
export interface DataService {
  getCurrentUser(): Promise<{ name: string; company: string; email: string }>;

  getNotifications(): Promise<Notification[]>;
  markNotificationRead(id: string, read: boolean): Promise<void>;

  getMessages(): Promise<Message[]>;
  markThreadRead(threadId: string): Promise<void>;
  sendReply(threadId: string, subject: string, body: string): Promise<Message>;

  getDocuments(): Promise<PortalDocument[]>;
  uploadDocument(doc: NewDocument): Promise<PortalDocument>;
  deleteDocument(id: string): Promise<void>;

  getAccounts(): Promise<Account[]>;
  createAccount(account: NewAccount): Promise<Account>;
  updateAccount(id: string, changes: Partial<NewAccount>): Promise<Account>;

  getContacts(): Promise<Contact[]>;
  createContact(contact: NewContact): Promise<Contact>;

  getOpportunities(): Promise<Opportunity[]>;
  createOpportunity(opportunity: NewOpportunity): Promise<Opportunity>;
  updateOpportunity(id: string, changes: Partial<NewOpportunity>): Promise<Opportunity>;

  getActivities(): Promise<Activity[]>;
  setActivityCompleted(id: string, completed: boolean): Promise<void>;
}
