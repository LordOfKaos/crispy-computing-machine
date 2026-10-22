import * as seed from '../data/mockData';
import type { DataService } from './dataService';
import type { Account, Message, Opportunity, PortalDocument } from '../types';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => structuredClone(v);
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

/** In-memory implementation backed by the dummy data. Changes last until the page reloads. */
export class MockDataService implements DataService {
  private notifications = clone(seed.notifications);
  private messages = clone(seed.messages);
  private documents = clone(seed.documents);
  private accounts = clone(seed.accounts);
  private contacts = clone(seed.contacts);
  private opportunities = clone(seed.opportunities);
  private activities = clone(seed.activities);

  async getCurrentUser() {
    await delay(50);
    return clone(seed.currentUser);
  }

  async getNotifications() {
    await delay();
    return clone(this.notifications);
  }

  async markNotificationRead(id: string, read: boolean) {
    await delay(50);
    const n = this.notifications.find((x) => x.id === id);
    if (n) n.read = read;
  }

  async getMessages() {
    await delay();
    return clone(this.messages);
  }

  async markThreadRead(threadId: string) {
    await delay(50);
    this.messages.filter((m) => m.threadId === threadId).forEach((m) => (m.read = true));
  }

  async sendReply(threadId: string, subject: string, body: string) {
    await delay();
    const msg: Message = {
      id: newId('m'),
      threadId,
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      body,
      fromName: seed.currentUser.name,
      fromRole: 'Partner',
      fromManagement: false,
      sentOn: new Date().toISOString(),
      read: true,
    };
    this.messages.push(msg);
    return clone(msg);
  }

  async getDocuments() {
    await delay();
    return clone(this.documents);
  }

  async uploadDocument({ file, ...meta }: Parameters<DataService['uploadDocument']>[0]) {
    await delay(600);
    const doc: PortalDocument = {
      ...meta,
      id: newId('d'),
      uploadedBy: seed.currentUser.name,
      uploadedOn: new Date().toISOString(),
    };
    this.documents.unshift(doc);
    return clone(doc);
  }

  async deleteDocument(id: string) {
    await delay();
    this.documents = this.documents.filter((d) => d.id !== id);
  }

  async getAccounts() {
    await delay();
    return clone(this.accounts);
  }

  async createAccount(account: Parameters<DataService['createAccount']>[0]) {
    await delay();
    const created: Account = { ...account, id: newId('a'), modifiedOn: new Date().toISOString() };
    this.accounts.push(created);
    return clone(created);
  }

  async updateAccount(id: string, changes: Partial<Omit<Account, 'id'>>) {
    await delay();
    const a = this.accounts.find((x) => x.id === id);
    if (!a) throw new Error(`Account ${id} not found`);
    Object.assign(a, changes, { modifiedOn: new Date().toISOString() });
    return clone(a);
  }

  async getContacts() {
    await delay();
    return clone(this.contacts);
  }

  async createContact(contact: Parameters<DataService['createContact']>[0]) {
    await delay();
    const created = { ...contact, id: newId('c') };
    this.contacts.push(created);
    return clone(created);
  }

  async getOpportunities() {
    await delay();
    return clone(this.opportunities);
  }

  async createOpportunity(opportunity: Parameters<DataService['createOpportunity']>[0]) {
    await delay();
    const created = { ...opportunity, id: newId('o') };
    this.opportunities.push(created);
    return clone(created);
  }

  async updateOpportunity(id: string, changes: Partial<Omit<Opportunity, 'id'>>) {
    await delay(100);
    const o = this.opportunities.find((x) => x.id === id);
    if (!o) throw new Error(`Opportunity ${id} not found`);
    Object.assign(o, changes);
    return clone(o);
  }

  async getActivities() {
    await delay();
    return clone(this.activities);
  }

  async setActivityCompleted(id: string, completed: boolean) {
    await delay(50);
    const a = this.activities.find((x) => x.id === id);
    if (a) a.completed = completed;
  }
}
