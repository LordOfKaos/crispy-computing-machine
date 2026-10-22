import type { DataService } from './dataService';
import type {
  Account,
  Activity,
  Contact,
  DocumentCategory,
  Message,
  NewAccount,
  NewContact,
  NewDocument,
  NewOpportunity,
  Notification,
  Opportunity,
  OpportunityStage,
  PortalDocument,
  Priority,
} from '../types';

/**
 * Dataverse Web API implementation (not yet wired up – the app uses MockDataService
 * unless VITE_DATA_SOURCE=dataverse).
 *
 * Standard tables: account, contact, opportunity, task, annotation.
 * Custom tables (names are placeholders – adjust to your solution's publisher prefix):
 *   pp_notification: pp_title, pp_body, pp_category (choice), pp_priority (choice), pp_isread
 *   pp_message:      pp_threadid, pp_subject, pp_body, pp_fromname, pp_fromrole,
 *                    pp_frommanagement, pp_isread
 */

type Row = Record<string, unknown>;
const FORMATTED = '@OData.Community.Display.V1.FormattedValue';

const STAGES: OpportunityStage[] = ['Qualify', 'Develop', 'Propose', 'Close']; // opportunity.salesstage 0..3
const PRIORITIES: Priority[] = ['low', 'normal', 'high']; // pp_priority 0..2
const NOTIFICATION_CATEGORIES: Notification['category'][] = ['announcement', 'action', 'system']; // pp_category 0..2

export class DataverseDataService implements DataService {
  private readonly api: string;

  constructor(
    orgUrl: string,
    private readonly getToken: () => Promise<string>,
  ) {
    this.api = `${orgUrl.replace(/\/$/, '')}/api/data/v9.2`;
  }

  private async request<T = Row>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.api}/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="*",return=representation',
        ...init.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message ?? `Dataverse request failed (${res.status})`);
    }
    return res.status === 204 ? (undefined as T) : res.json();
  }

  private async list(path: string): Promise<Row[]> {
    return (await this.request<{ value: Row[] }>(path)).value;
  }

  // ---- mappers -------------------------------------------------------------

  private toNotification = (r: Row): Notification => ({
    id: r.pp_notificationid as string,
    title: r.pp_title as string,
    body: r.pp_body as string,
    category: NOTIFICATION_CATEGORIES[r.pp_category as number] ?? 'announcement',
    priority: PRIORITIES[r.pp_priority as number] ?? 'normal',
    createdOn: r.createdon as string,
    read: Boolean(r.pp_isread),
  });

  private toMessage = (r: Row): Message => ({
    id: r.pp_messageid as string,
    threadId: r.pp_threadid as string,
    subject: r.pp_subject as string,
    body: r.pp_body as string,
    fromName: r.pp_fromname as string,
    fromRole: r.pp_fromrole as string,
    fromManagement: Boolean(r.pp_frommanagement),
    sentOn: r.createdon as string,
    read: Boolean(r.pp_isread),
  });

  private toDocument = (r: Row): PortalDocument => ({
    id: r.annotationid as string,
    fileName: r.filename as string,
    mimeType: r.mimetype as string,
    sizeBytes: r.filesize as number,
    category: (r.subject as DocumentCategory) || 'Other',
    description: (r.notetext as string) ?? '',
    uploadedBy: (r[`_createdby_value${FORMATTED}`] as string) ?? '',
    uploadedOn: r.createdon as string,
    accountId: (r._objectid_value as string) ?? undefined,
  });

  private toAccount = (r: Row): Account => ({
    id: r.accountid as string,
    name: r.name as string,
    industry: (r[`industrycode${FORMATTED}`] as string) ?? '',
    city: (r.address1_city as string) ?? '',
    phone: (r.telephone1 as string) ?? '',
    website: (r.websiteurl as string) ?? '',
    status: r.statecode === 0 ? 'active' : 'inactive',
    primaryContactId: (r._primarycontactid_value as string) ?? undefined,
    modifiedOn: r.modifiedon as string,
  });

  private fromAccount(a: Partial<NewAccount>): Row {
    const row: Row = {};
    if (a.name !== undefined) row.name = a.name;
    if (a.city !== undefined) row.address1_city = a.city;
    if (a.phone !== undefined) row.telephone1 = a.phone;
    if (a.website !== undefined) row.websiteurl = a.website;
    if (a.status !== undefined) {
      row.statecode = a.status === 'active' ? 0 : 1;
      row.statuscode = a.status === 'active' ? 1 : 2;
    }
    if (a.primaryContactId) row['primarycontactid@odata.bind'] = `/contacts(${a.primaryContactId})`;
    // industrycode is a choice column; map a.industry to its integer value here once known.
    return row;
  }

  private toContact = (r: Row): Contact => ({
    id: r.contactid as string,
    firstName: (r.firstname as string) ?? '',
    lastName: (r.lastname as string) ?? '',
    jobTitle: (r.jobtitle as string) ?? '',
    email: (r.emailaddress1 as string) ?? '',
    phone: (r.telephone1 as string) ?? '',
    accountId: (r._parentcustomerid_value as string) ?? undefined,
  });

  private toOpportunity = (r: Row): Opportunity => ({
    id: r.opportunityid as string,
    name: r.name as string,
    accountId: r._parentaccountid_value as string,
    estimatedValue: (r.estimatedvalue as number) ?? 0,
    stage: STAGES[r.salesstage as number] ?? 'Qualify',
    probability: (r.closeprobability as number) ?? 0,
    estimatedCloseDate: r.estimatedclosedate as string,
  });

  private fromOpportunity(o: Partial<NewOpportunity>): Row {
    const row: Row = {};
    if (o.name !== undefined) row.name = o.name;
    if (o.accountId) row['parentaccountid@odata.bind'] = `/accounts(${o.accountId})`;
    if (o.estimatedValue !== undefined) row.estimatedvalue = o.estimatedValue;
    if (o.stage !== undefined) row.salesstage = STAGES.indexOf(o.stage);
    if (o.probability !== undefined) row.closeprobability = o.probability;
    if (o.estimatedCloseDate !== undefined) row.estimatedclosedate = o.estimatedCloseDate.slice(0, 10);
    return row;
  }

  private toActivity = (r: Row): Activity => ({
    id: r.activityid as string,
    subject: r.subject as string,
    accountId: r._regardingobjectid_value as string,
    dueDate: r.scheduledend as string,
    completed: r.statecode === 1,
  });

  // ---- DataService ---------------------------------------------------------

  async getCurrentUser() {
    const { UserId } = await this.request<{ UserId: string }>('WhoAmI');
    const u = await this.request(
      `systemusers(${UserId})?$select=fullname,internalemailaddress&$expand=businessunitid($select=name)`,
    );
    return {
      name: u.fullname as string,
      email: u.internalemailaddress as string,
      company: ((u.businessunitid as Row | undefined)?.name as string) ?? '',
    };
  }

  async getNotifications() {
    return (await this.list('pp_notifications?$orderby=createdon desc')).map(this.toNotification);
  }

  async markNotificationRead(id: string, read: boolean) {
    await this.request(`pp_notifications(${id})`, { method: 'PATCH', body: JSON.stringify({ pp_isread: read }) });
  }

  async getMessages() {
    return (await this.list('pp_messages?$orderby=createdon asc')).map(this.toMessage);
  }

  async markThreadRead(threadId: string) {
    const unread = await this.list(
      `pp_messages?$select=pp_messageid&$filter=pp_threadid eq '${threadId}' and pp_isread eq false`,
    );
    await Promise.all(
      unread.map((r) =>
        this.request(`pp_messages(${r.pp_messageid})`, { method: 'PATCH', body: JSON.stringify({ pp_isread: true }) }),
      ),
    );
  }

  async sendReply(threadId: string, subject: string, body: string) {
    const user = await this.getCurrentUser();
    const row = await this.request('pp_messages', {
      method: 'POST',
      body: JSON.stringify({
        pp_threadid: threadId,
        pp_subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
        pp_body: body,
        pp_fromname: user.name,
        pp_fromrole: 'Partner',
        pp_frommanagement: false,
        pp_isread: true,
      }),
    });
    return this.toMessage(row);
  }

  async getDocuments() {
    return (
      await this.list(
        'annotations?$select=annotationid,filename,mimetype,filesize,subject,notetext,createdon,_createdby_value,_objectid_value' +
          '&$filter=isdocument eq true&$orderby=createdon desc',
      )
    ).map(this.toDocument);
  }

  async uploadDocument({ file, ...meta }: NewDocument) {
    const documentbody = await fileToBase64(file);
    const row: Row = {
      filename: meta.fileName,
      mimetype: meta.mimeType,
      subject: meta.category,
      notetext: meta.description,
      documentbody,
    };
    if (meta.accountId) {
      row['objectid_account@odata.bind'] = `/accounts(${meta.accountId})`;
      row.objecttypecode = 'account';
    }
    return this.toDocument(await this.request('annotations', { method: 'POST', body: JSON.stringify(row) }));
  }

  async deleteDocument(id: string) {
    await this.request(`annotations(${id})`, { method: 'DELETE' });
  }

  async getAccounts() {
    return (
      await this.list(
        'accounts?$select=name,industrycode,address1_city,telephone1,websiteurl,statecode,_primarycontactid_value,modifiedon&$orderby=name',
      )
    ).map(this.toAccount);
  }

  async createAccount(account: NewAccount) {
    return this.toAccount(
      await this.request('accounts', { method: 'POST', body: JSON.stringify(this.fromAccount(account)) }),
    );
  }

  async updateAccount(id: string, changes: Partial<NewAccount>) {
    return this.toAccount(
      await this.request(`accounts(${id})`, { method: 'PATCH', body: JSON.stringify(this.fromAccount(changes)) }),
    );
  }

  async getContacts() {
    return (
      await this.list(
        'contacts?$select=firstname,lastname,jobtitle,emailaddress1,telephone1,_parentcustomerid_value&$orderby=lastname',
      )
    ).map(this.toContact);
  }

  async createContact(c: NewContact) {
    const row: Row = {
      firstname: c.firstName,
      lastname: c.lastName,
      jobtitle: c.jobTitle,
      emailaddress1: c.email,
      telephone1: c.phone,
    };
    if (c.accountId) row['parentcustomerid_account@odata.bind'] = `/accounts(${c.accountId})`;
    return this.toContact(await this.request('contacts', { method: 'POST', body: JSON.stringify(row) }));
  }

  async getOpportunities() {
    return (
      await this.list(
        'opportunities?$select=name,_parentaccountid_value,estimatedvalue,salesstage,closeprobability,estimatedclosedate&$filter=statecode eq 0',
      )
    ).map(this.toOpportunity);
  }

  async createOpportunity(o: NewOpportunity) {
    return this.toOpportunity(
      await this.request('opportunities', { method: 'POST', body: JSON.stringify(this.fromOpportunity(o)) }),
    );
  }

  async updateOpportunity(id: string, changes: Partial<NewOpportunity>) {
    return this.toOpportunity(
      await this.request(`opportunities(${id})`, {
        method: 'PATCH',
        body: JSON.stringify(this.fromOpportunity(changes)),
      }),
    );
  }

  async getActivities() {
    return (
      await this.list('tasks?$select=subject,scheduledend,statecode,_regardingobjectid_value&$orderby=scheduledend')
    ).map(this.toActivity);
  }

  async setActivityCompleted(id: string, completed: boolean) {
    await this.request(`tasks(${id})`, {
      method: 'PATCH',
      body: JSON.stringify(completed ? { statecode: 1, statuscode: 5 } : { statecode: 0, statuscode: 2 }),
    });
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
