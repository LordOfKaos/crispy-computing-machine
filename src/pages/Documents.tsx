import { useEffect, useRef, useState, type DragEvent } from 'react';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { dataService } from '../services';
import type { Account, DocumentCategory, PortalDocument } from '../types';
import { formatBytes, formatDate } from '../utils';

const CATEGORIES: DocumentCategory[] = ['Contract', 'Compliance', 'Invoice', 'Report', 'Other'];
// Dataverse's default attachment limit is 5 MB (configurable in system settings).
const MAX_BYTES = 5 * 1024 * 1024;

interface PendingUpload {
  file: File;
  category: DocumentCategory;
  description: string;
  accountId: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([dataService.getDocuments(), dataService.getAccounts()])
      .then(([d, a]) => {
        setDocuments(d);
        setAccounts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const all = [...files];
    const tooBig = all.filter((f) => f.size > MAX_BYTES);
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} exceeds the ${formatBytes(MAX_BYTES)} limit.` : '');
    const ok = all.filter((f) => f.size <= MAX_BYTES);
    if (ok.length) {
      setPending(ok.map((file) => ({ file, category: 'Other', description: '', accountId: '' })));
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const updatePending = (i: number, changes: Partial<PendingUpload>) =>
    setPending((p) => p.map((item, idx) => (idx === i ? { ...item, ...changes } : item)));

  const upload = async () => {
    setUploading(true);
    try {
      const created = await Promise.all(
        pending.map((p) =>
          dataService.uploadDocument({
            file: p.file,
            fileName: p.file.name,
            mimeType: p.file.type || 'application/octet-stream',
            sizeBytes: p.file.size,
            category: p.category,
            description: p.description,
            accountId: p.accountId || undefined,
          }),
        ),
      );
      setDocuments((d) => [...created, ...d]);
      setPending([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (doc: PortalDocument) => {
    if (!confirm(`Delete ${doc.fileName}?`)) return;
    await dataService.deleteDocument(doc.id);
    setDocuments((d) => d.filter((x) => x.id !== doc.id));
  };

  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? '—';
  const visible = documents.filter(
    (d) =>
      (category === 'all' || d.category === category) &&
      (d.fileName + d.description).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="stack">
      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <Icon name="upload" size={28} />
        <strong>Drag files here or click to browse</strong>
        <span className="muted small">PDF, Word, Excel or images · up to {formatBytes(MAX_BYTES)} each</span>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>
      {error && <p className="alert">{error}</p>}

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search documents" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory | 'all')}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <section className="card flush">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Related account</th>
                <th>Uploaded</th>
                <th>Size</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="empty">Loading…</td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">No documents found.</td>
                </tr>
              )}
              {visible.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="file-cell">
                      <span className="file-ext">{d.fileName.split('.').pop()}</span>
                      <div>
                        <strong>{d.fileName}</strong>
                        {d.description && <div className="muted small">{d.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pill">{d.category}</span>
                  </td>
                  <td>{accountName(d.accountId)}</td>
                  <td>
                    {formatDate(d.uploadedOn)}
                    <div className="muted small">{d.uploadedBy}</div>
                  </td>
                  <td>{formatBytes(d.sizeBytes)}</td>
                  <td>
                    <button className="icon-btn" onClick={() => remove(d)} aria-label={`Delete ${d.fileName}`}>
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pending.length > 0 && (
        <Modal
          title={`Upload ${pending.length} document${pending.length > 1 ? 's' : ''}`}
          onClose={() => !uploading && setPending([])}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPending([])} disabled={uploading}>
                Cancel
              </button>
              <button className="btn" onClick={upload} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </>
          }
        >
          {pending.map((p, i) => (
            <fieldset key={i} className="upload-item">
              <legend>
                {p.file.name} <span className="muted small">({formatBytes(p.file.size)})</span>
              </legend>
              <div className="form-grid">
                <label>
                  Category
                  <select value={p.category} onChange={(e) => updatePending(i, { category: e.target.value as DocumentCategory })}>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Related account
                  <select value={p.accountId} onChange={(e) => updatePending(i, { accountId: e.target.value })}>
                    <option value="">None</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  Description
                  <input value={p.description} onChange={(e) => updatePending(i, { description: e.target.value })} />
                </label>
              </div>
            </fieldset>
          ))}
        </Modal>
      )}
    </div>
  );
}
