import type {
  Account,
  Activity,
  Contact,
  Message,
  Notification,
  Opportunity,
  PortalDocument,
} from '../types';

// Dates are relative to "now" so the dummy data always looks current.
const daysAgo = (d: number, h = 9) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, 0, 0, 0);
  return date.toISOString();
};
const daysAhead = (d: number) => daysAgo(-d);

export const currentUser = {
  name: 'Alex Morgan',
  company: 'Northbridge Facilities Ltd',
  email: 'alex.morgan@northbridge.example',
};

export const notifications: Notification[] = [
  {
    id: 'n1',
    title: 'Q4 partner compliance pack due',
    body: 'Please upload your signed Q4 compliance declaration and updated insurance certificates by the end of the month.',
    category: 'action',
    priority: 'high',
    createdOn: daysAgo(0, 8),
    read: false,
  },
  {
    id: 'n2',
    title: 'New partner onboarding guide published',
    body: 'The management team has published version 3 of the partner onboarding guide. It is now available in the Documents area.',
    category: 'announcement',
    priority: 'normal',
    createdOn: daysAgo(1, 14),
    read: false,
  },
  {
    id: 'n3',
    title: 'Scheduled maintenance this weekend',
    body: 'The portal will be unavailable on Saturday between 22:00 and 02:00 while we carry out planned maintenance.',
    category: 'system',
    priority: 'low',
    createdOn: daysAgo(2, 11),
    read: false,
  },
  {
    id: 'n4',
    title: 'Partner of the quarter nominations open',
    body: 'Nominations for partner of the quarter are open until the 15th. Speak to your account manager for details.',
    category: 'announcement',
    priority: 'normal',
    createdOn: daysAgo(5, 10),
    read: true,
  },
  {
    id: 'n5',
    title: 'Invoice INV-20431 approved',
    body: 'Your invoice INV-20431 has been approved and is scheduled for payment within 30 days.',
    category: 'system',
    priority: 'low',
    createdOn: daysAgo(8, 16),
    read: true,
  },
  {
    id: 'n6',
    title: 'Update your safeguarding training records',
    body: 'All partner staff working on public-sector contracts must have current safeguarding training. Please confirm your records are up to date.',
    category: 'action',
    priority: 'normal',
    createdOn: daysAgo(12, 9),
    read: true,
  },
];

export const messages: Message[] = [
  {
    id: 'm1',
    threadId: 't1',
    subject: 'Contract renewal – next steps',
    body: 'Hi Alex,\n\nThanks for a strong year. We would like to start the renewal conversation for the facilities contract. Could you share your updated rate card by Friday?\n\nBest regards,\nSarah',
    fromName: 'Sarah Patel',
    fromRole: 'Partner Director',
    fromManagement: true,
    sentOn: daysAgo(3, 10),
    read: true,
  },
  {
    id: 'm2',
    threadId: 't1',
    subject: 'Re: Contract renewal – next steps',
    body: 'Hi Sarah,\n\nThanks – great to hear. I will have the rate card over to you by Thursday.\n\nAlex',
    fromName: 'Alex Morgan',
    fromRole: 'Partner',
    fromManagement: false,
    sentOn: daysAgo(3, 15),
    read: true,
  },
  {
    id: 'm3',
    threadId: 't1',
    subject: 'Re: Contract renewal – next steps',
    body: 'Perfect, thank you. I have also booked a review meeting for next Tuesday at 10:00 – invite to follow.\n\nSarah',
    fromName: 'Sarah Patel',
    fromRole: 'Partner Director',
    fromManagement: true,
    sentOn: daysAgo(0, 9),
    read: false,
  },
  {
    id: 'm4',
    threadId: 't2',
    subject: 'Monthly performance report – feedback',
    body: 'Hi Alex,\n\nWe have reviewed last month\'s performance report. SLA attainment is up to 97%, which is excellent. One query: could you add a breakdown of reactive vs planned jobs going forward?\n\nThanks,\nJames',
    fromName: 'James Okafor',
    fromRole: 'Operations Manager',
    fromManagement: true,
    sentOn: daysAgo(1, 11),
    read: false,
  },
  {
    id: 'm5',
    threadId: 't3',
    subject: 'Welcome to the new partner portal',
    body: 'Hello,\n\nWelcome to the new partner portal. You can use it to view announcements, message the management team, upload documents and manage your customer relationships.\n\nIf you have any feedback please reply to this message.\n\nThe Partner Management Team',
    fromName: 'Partner Management Team',
    fromRole: 'Management',
    fromManagement: true,
    sentOn: daysAgo(14, 9),
    read: true,
  },
];

export const accounts: Account[] = [
  { id: 'a1', name: 'Riverside Health Trust', industry: 'Healthcare', city: 'Manchester', phone: '0161 555 0101', website: 'riversidehealth.example', status: 'active', primaryContactId: 'c1', modifiedOn: daysAgo(2) },
  { id: 'a2', name: 'Kingsway Borough Council', industry: 'Local Government', city: 'Leeds', phone: '0113 555 0144', website: 'kingsway.example', status: 'active', primaryContactId: 'c3', modifiedOn: daysAgo(6) },
  { id: 'a3', name: 'Harbour Transport Group', industry: 'Transport', city: 'Bristol', phone: '0117 555 0190', website: 'harbourtransport.example', status: 'active', primaryContactId: 'c4', modifiedOn: daysAgo(9) },
  { id: 'a4', name: 'Fenwick Defence Systems', industry: 'Defence', city: 'Portsmouth', phone: '023 555 0177', website: 'fenwickdefence.example', status: 'active', primaryContactId: 'c5', modifiedOn: daysAgo(15) },
  { id: 'a5', name: 'Oakfield Academy Trust', industry: 'Education', city: 'Birmingham', phone: '0121 555 0122', website: 'oakfield.example', status: 'inactive', primaryContactId: 'c6', modifiedOn: daysAgo(40) },
];

export const contacts: Contact[] = [
  { id: 'c1', firstName: 'Priya', lastName: 'Shah', jobTitle: 'Estates Director', email: 'priya.shah@riversidehealth.example', phone: '07700 900101', accountId: 'a1' },
  { id: 'c2', firstName: 'Tom', lastName: 'Bennett', jobTitle: 'Procurement Lead', email: 'tom.bennett@riversidehealth.example', phone: '07700 900102', accountId: 'a1' },
  { id: 'c3', firstName: 'Helen', lastName: 'Clarke', jobTitle: 'Head of Commissioning', email: 'helen.clarke@kingsway.example', phone: '07700 900103', accountId: 'a2' },
  { id: 'c4', firstName: 'Marcus', lastName: 'Reid', jobTitle: 'Fleet Manager', email: 'marcus.reid@harbourtransport.example', phone: '07700 900104', accountId: 'a3' },
  { id: 'c5', firstName: 'Fiona', lastName: 'Walsh', jobTitle: 'Programme Manager', email: 'fiona.walsh@fenwickdefence.example', phone: '07700 900105', accountId: 'a4' },
  { id: 'c6', firstName: 'David', lastName: 'Ng', jobTitle: 'Business Manager', email: 'david.ng@oakfield.example', phone: '07700 900106', accountId: 'a5' },
];

export const opportunities: Opportunity[] = [
  { id: 'o1', name: 'Hospital soft FM extension', accountId: 'a1', estimatedValue: 420000, stage: 'Propose', probability: 60, estimatedCloseDate: daysAhead(30) },
  { id: 'o2', name: 'Council HQ cleaning contract', accountId: 'a2', estimatedValue: 185000, stage: 'Develop', probability: 40, estimatedCloseDate: daysAhead(55) },
  { id: 'o3', name: 'Depot security upgrade', accountId: 'a3', estimatedValue: 96000, stage: 'Qualify', probability: 20, estimatedCloseDate: daysAhead(90) },
  { id: 'o4', name: 'Site maintenance framework', accountId: 'a4', estimatedValue: 760000, stage: 'Close', probability: 85, estimatedCloseDate: daysAhead(12) },
  { id: 'o5', name: 'Car park management', accountId: 'a2', estimatedValue: 54000, stage: 'Qualify', probability: 15, estimatedCloseDate: daysAhead(120) },
];

export const activities: Activity[] = [
  { id: 'act1', subject: 'Send revised proposal', accountId: 'a1', dueDate: daysAhead(2), completed: false },
  { id: 'act2', subject: 'Site walk-round with Helen', accountId: 'a2', dueDate: daysAhead(5), completed: false },
  { id: 'act3', subject: 'Follow up on security survey', accountId: 'a3', dueDate: daysAgo(1), completed: false },
  { id: 'act4', subject: 'Contract signature', accountId: 'a4', dueDate: daysAhead(10), completed: false },
  { id: 'act5', subject: 'Quarterly review call', accountId: 'a1', dueDate: daysAgo(7), completed: true },
];

export const documents: PortalDocument[] = [
  { id: 'd1', fileName: 'Partner-Onboarding-Guide-v3.pdf', mimeType: 'application/pdf', sizeBytes: 2_480_000, category: 'Other', description: 'Published by the management team', uploadedBy: 'Partner Management Team', uploadedOn: daysAgo(1, 14) },
  { id: 'd2', fileName: 'Q3-Compliance-Declaration.pdf', mimeType: 'application/pdf', sizeBytes: 312_000, category: 'Compliance', description: 'Signed Q3 declaration', uploadedBy: 'Alex Morgan', uploadedOn: daysAgo(60) },
  { id: 'd3', fileName: 'Performance-Report-September.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sizeBytes: 84_000, category: 'Report', description: 'Monthly SLA report', uploadedBy: 'Alex Morgan', uploadedOn: daysAgo(20), accountId: 'a1' },
  { id: 'd4', fileName: 'INV-20431.pdf', mimeType: 'application/pdf', sizeBytes: 120_000, category: 'Invoice', description: '', uploadedBy: 'Alex Morgan', uploadedOn: daysAgo(10), accountId: 'a2' },
];
