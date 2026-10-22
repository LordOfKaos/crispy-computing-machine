import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { dataService } from '../services';
import type { Account, Activity, Contact, NewAccount, NewContact, NewOpportunity, Opportunity, OpportunityStage } from '../types';
import { formatCurrency, formatDate, initials } from '../utils';

const STAGES: OpportunityStage[] = ['Qualify', 'Develop', 'Propose', 'Close'];

interface CrmData {
  accounts: Account[];
  contacts: Contact[];
  opportunities: Opportunity[];
  activities: Activity[];
}

export default function Crm() {
  const [data, setData] = useState<CrmData | null>(null);

  useEffect(() => {
    Promise.all([
      dataService.getAccounts(),
      dataService.getContacts(),
      dataService.getOpportunities(),
      dataService.getActivities(),
    ]).then(([accounts, contacts, opportunities, activities]) =>
      setData({ accounts, contacts, opportunities, activities }),
    );
  }, []);

  const update = (changes: Partial<CrmData>) => setData((d) => (d ? { ...d, ...changes } : d));

  return (
    <div className="stack">
      <nav className="tabs">
        <NavLink to="/crm" end>Accounts</NavLink>
        <NavLink to="/crm/contacts">Contacts</NavLink>
        <NavLink to="/crm/opportunities">Opportunities</NavLink>
        <NavLink to="/crm/tasks">Tasks</NavLink>
      </nav>
      {!data ? (
        <p className="muted">Loading…</p>
      ) : (
        <Routes>
          <Route index element={<Accounts data={data} update={update} />} />
          <Route path="contacts" element={<Contacts data={data} update={update} />} />
          <Route path="opportunities" element={<Opportunities data={data} update={update} />} />
          <Route path="tasks" element={<Tasks data={data} update={update} />} />
        </Routes>
      )}
    </div>
  );
}

interface TabProps {
  data: CrmData;
  update(changes: Partial<CrmData>): void;
}

// ---- Accounts ---------------------------------------------------------------

function Accounts({ data, update }: TabProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  const visible = data.accounts.filter((a) =>
    `${a.name} ${a.industry} ${a.city}`.toLowerCase().includes(query.toLowerCase()),
  );
  const contactName = (id?: string) => {
    const c = data.contacts.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const create = async (a: NewAccount) => {
    const created = await dataService.createAccount(a);
    update({ accounts: [...data.accounts, created] });
    setCreating(false);
  };

  return (
    <>
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search accounts" />
        <button className="btn" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} /> New account
        </button>
      </div>
      <section className="card flush">
        <div className="table-wrap">
          <table className="clickable">
            <thead>
              <tr>
                <th>Account</th>
                <th>Industry</th>
                <th>City</th>
                <th>Primary contact</th>
                <th>Open pipeline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} onClick={() => setSelected(a)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(a)}>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.industry}</td>
                  <td>{a.city}</td>
                  <td>{contactName(a.primaryContactId)}</td>
                  <td>
                    {formatCurrency(
                      data.opportunities.filter((o) => o.accountId === a.id).reduce((s, o) => s + o.estimatedValue, 0),
                    )}
                  </td>
                  <td><span className={`pill pill-${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="empty">No accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && <AccountDetail account={selected} data={data} onClose={() => setSelected(null)} />}
      {creating && <AccountForm onCancel={() => setCreating(false)} onSave={create} />}
    </>
  );
}

function AccountDetail({ account, data, onClose }: { account: Account; data: CrmData; onClose(): void }) {
  const contacts = data.contacts.filter((c) => c.accountId === account.id);
  const opportunities = data.opportunities.filter((o) => o.accountId === account.id);
  const activities = data.activities.filter((a) => a.accountId === account.id);

  return (
    <Modal title={account.name} onClose={onClose}>
      <dl className="details">
        <div><dt>Industry</dt><dd>{account.industry}</dd></div>
        <div><dt>City</dt><dd>{account.city}</dd></div>
        <div><dt>Phone</dt><dd>{account.phone}</dd></div>
        <div><dt>Website</dt><dd>{account.website}</dd></div>
        <div><dt>Status</dt><dd>{account.status}</dd></div>
        <div><dt>Last modified</dt><dd>{formatDate(account.modifiedOn)}</dd></div>
      </dl>
      <h4>Contacts ({contacts.length})</h4>
      <ul className="list compact">
        {contacts.map((c) => (
          <li key={c.id}>
            <div className="list-main">
              <strong>{c.firstName} {c.lastName}</strong>
              <span className="muted small">{c.jobTitle} · {c.email}</span>
            </div>
          </li>
        ))}
      </ul>
      <h4>Opportunities ({opportunities.length})</h4>
      <ul className="list compact">
        {opportunities.map((o) => (
          <li key={o.id}>
            <div className="list-main">
              <strong>{o.name}</strong>
              <span className="muted small">{o.stage} · closes {formatDate(o.estimatedCloseDate)}</span>
            </div>
            <span>{formatCurrency(o.estimatedValue)}</span>
          </li>
        ))}
      </ul>
      <h4>Tasks ({activities.length})</h4>
      <ul className="list compact">
        {activities.map((a) => (
          <li key={a.id}>
            <div className="list-main">
              <strong className={a.completed ? 'done' : ''}>{a.subject}</strong>
              <span className="muted small">Due {formatDate(a.dueDate)}</span>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function AccountForm({ onCancel, onSave }: { onCancel(): void; onSave(a: NewAccount): Promise<void> }) {
  const [form, setForm] = useState<NewAccount>({ name: '', industry: '', city: '', phone: '', website: '', status: 'active' });
  const set = (k: keyof NewAccount) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  return (
    <FormModal title="New account" onCancel={onCancel} onSubmit={() => onSave(form)} valid={!!form.name.trim()}>
      <label className="span-2">Account name *<input required value={form.name} onChange={set('name')} autoFocus /></label>
      <label>Industry<input value={form.industry} onChange={set('industry')} /></label>
      <label>City<input value={form.city} onChange={set('city')} /></label>
      <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
      <label>Website<input value={form.website} onChange={set('website')} /></label>
    </FormModal>
  );
}

// ---- Contacts ---------------------------------------------------------------

function Contacts({ data, update }: TabProps) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const accountName = (id?: string) => data.accounts.find((a) => a.id === id)?.name ?? '—';
  const visible = data.contacts.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.email} ${accountName(c.accountId)}`.toLowerCase().includes(query.toLowerCase()),
  );

  const create = async (c: NewContact) => {
    const created = await dataService.createContact(c);
    update({ contacts: [...data.contacts, created] });
    setCreating(false);
  };

  return (
    <>
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search contacts" />
        <button className="btn" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} /> New contact
        </button>
      </div>
      <section className="card flush">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Job title</th><th>Account</th><th>Email</th><th>Phone</th></tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="file-cell">
                      <span className="avatar small">{initials(`${c.firstName} ${c.lastName}`)}</span>
                      <strong>{c.firstName} {c.lastName}</strong>
                    </div>
                  </td>
                  <td>{c.jobTitle}</td>
                  <td>{accountName(c.accountId)}</td>
                  <td><a href={`mailto:${c.email}`}>{c.email}</a></td>
                  <td>{c.phone}</td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={5} className="empty">No contacts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {creating && <ContactForm accounts={data.accounts} onCancel={() => setCreating(false)} onSave={create} />}
    </>
  );
}

function ContactForm({ accounts, onCancel, onSave }: { accounts: Account[]; onCancel(): void; onSave(c: NewContact): Promise<void> }) {
  const [form, setForm] = useState<NewContact>({ firstName: '', lastName: '', jobTitle: '', email: '', phone: '', accountId: '' });
  const set = (k: keyof NewContact) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  return (
    <FormModal
      title="New contact"
      onCancel={onCancel}
      onSubmit={() => onSave({ ...form, accountId: form.accountId || undefined })}
      valid={!!form.lastName.trim()}
    >
      <label>First name<input value={form.firstName} onChange={set('firstName')} autoFocus /></label>
      <label>Last name *<input required value={form.lastName} onChange={set('lastName')} /></label>
      <label>Job title<input value={form.jobTitle} onChange={set('jobTitle')} /></label>
      <label>
        Account
        <select value={form.accountId} onChange={set('accountId')}>
          <option value="">None</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
      <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
    </FormModal>
  );
}

// ---- Opportunities (pipeline board) -----------------------------------------

function Opportunities({ data, update }: TabProps) {
  const [creating, setCreating] = useState(false);
  const accountName = (id: string) => data.accounts.find((a) => a.id === id)?.name ?? '—';

  const move = async (o: Opportunity, stage: OpportunityStage) => {
    update({ opportunities: data.opportunities.map((x) => (x.id === o.id ? { ...x, stage } : x)) });
    await dataService.updateOpportunity(o.id, { stage });
  };

  const create = async (o: NewOpportunity) => {
    const created = await dataService.createOpportunity(o);
    update({ opportunities: [...data.opportunities, created] });
    setCreating(false);
  };

  return (
    <>
      <div className="toolbar">
        <span className="muted">
          {data.opportunities.length} open · {formatCurrency(data.opportunities.reduce((s, o) => s + o.estimatedValue, 0))} total
        </span>
        <button className="btn" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} /> New opportunity
        </button>
      </div>
      <div className="board">
        {STAGES.map((stage) => {
          const items = data.opportunities.filter((o) => o.stage === stage);
          return (
            <section
              key={stage}
              className="board-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const o = data.opportunities.find((x) => x.id === e.dataTransfer.getData('text/plain'));
                if (o && o.stage !== stage) move(o, stage);
              }}
            >
              <header>
                <h4>{stage}</h4>
                <span className="muted small">{formatCurrency(items.reduce((s, o) => s + o.estimatedValue, 0))}</span>
              </header>
              {items.map((o) => (
                <article
                  key={o.id}
                  className="opp-card"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', o.id)}
                >
                  <strong>{o.name}</strong>
                  <span className="muted small">{accountName(o.accountId)}</span>
                  <div className="opp-meta">
                    <span>{formatCurrency(o.estimatedValue)}</span>
                    <span className="muted small">{o.probability}%</span>
                  </div>
                  <div className="opp-meta">
                    <span className="muted small">Close {formatDate(o.estimatedCloseDate)}</span>
                    <select
                      aria-label="Stage"
                      value={o.stage}
                      onChange={(e) => move(o, e.target.value as OpportunityStage)}
                    >
                      {STAGES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      {creating && <OpportunityForm accounts={data.accounts} onCancel={() => setCreating(false)} onSave={create} />}
    </>
  );
}

function OpportunityForm({
  accounts,
  onCancel,
  onSave,
}: {
  accounts: Account[];
  onCancel(): void;
  onSave(o: NewOpportunity): Promise<void>;
}) {
  const [form, setForm] = useState({
    name: '',
    accountId: accounts[0]?.id ?? '',
    estimatedValue: '',
    stage: 'Qualify' as OpportunityStage,
    probability: '20',
    estimatedCloseDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  return (
    <FormModal
      title="New opportunity"
      onCancel={onCancel}
      valid={!!form.name.trim() && !!form.accountId}
      onSubmit={() =>
        onSave({
          ...form,
          estimatedValue: Number(form.estimatedValue) || 0,
          probability: Number(form.probability) || 0,
          estimatedCloseDate: new Date(form.estimatedCloseDate).toISOString(),
        })
      }
    >
      <label className="span-2">Name *<input required value={form.name} onChange={set('name')} autoFocus /></label>
      <label className="span-2">
        Account *
        <select value={form.accountId} onChange={set('accountId')}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Estimated value (£)<input type="number" min="0" value={form.estimatedValue} onChange={set('estimatedValue')} /></label>
      <label>Probability (%)<input type="number" min="0" max="100" value={form.probability} onChange={set('probability')} /></label>
      <label>
        Stage
        <select value={form.stage} onChange={set('stage')}>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label>Estimated close<input type="date" value={form.estimatedCloseDate} onChange={set('estimatedCloseDate')} /></label>
    </FormModal>
  );
}

// ---- Tasks ------------------------------------------------------------------

function Tasks({ data, update }: TabProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const accountName = (id: string) => data.accounts.find((a) => a.id === id)?.name ?? '—';
  const visible = data.activities
    .filter((a) => showCompleted || !a.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const toggle = async (a: Activity) => {
    update({ activities: data.activities.map((x) => (x.id === a.id ? { ...x, completed: !x.completed } : x)) });
    await dataService.setActivityCompleted(a.id, !a.completed);
  };

  return (
    <>
      <div className="toolbar">
        <label className="checkbox">
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
          Show completed
        </label>
      </div>
      <section className="card flush">
        <ul className="task-list">
          {visible.map((a) => {
            const overdue = !a.completed && new Date(a.dueDate) < new Date();
            return (
              <li key={a.id}>
                <label className="checkbox">
                  <input type="checkbox" checked={a.completed} onChange={() => toggle(a)} />
                  <span className={a.completed ? 'done' : ''}>{a.subject}</span>
                </label>
                <span className="muted small">{accountName(a.accountId)}</span>
                <span className={`small ${overdue ? 'text-danger' : 'muted'}`}>
                  {overdue ? 'Overdue · ' : ''}{formatDate(a.dueDate)}
                </span>
              </li>
            );
          })}
          {visible.length === 0 && <p className="empty">Nothing to do. Nice.</p>}
        </ul>
      </section>
    </>
  );
}

// ---- shared -----------------------------------------------------------------

function SearchBox({ value, onChange, placeholder }: { value: string; onChange(v: string): void; placeholder: string }) {
  return (
    <div className="search">
      <Icon name="search" size={16} />
      <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FormModal({
  title,
  onCancel,
  onSubmit,
  valid,
  children,
}: {
  title: string;
  onCancel(): void;
  onSubmit(): Promise<void>;
  valid: boolean;
  children: ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSubmit();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={() => submit()} disabled={!valid || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form className="form-grid" onSubmit={submit}>
        {children}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
