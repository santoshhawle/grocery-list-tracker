import { useState, useEffect, useRef } from 'react';
import {
  Trash2, Pencil, Check, X, Plus, ShoppingCart, AlertTriangle, Clock,
} from 'lucide-react';
import Header from '../components/Header';

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  expiryDate: string;
}

const STORAGE_KEY = 'grocery-list';

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + 'T00:00:00');
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function expiryStatus(dateStr: string): 'expired' | 'soon' | 'ok' {
  const d = daysUntil(dateStr);
  if (d < 0) return 'expired';
  if (d <= 3) return 'soon';
  return 'ok';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const rowBg: Record<'expired' | 'soon' | 'ok', string> = {
  expired: 'bg-red-50 border-l-4 border-red-400',
  soon:    'bg-amber-50 border-l-4 border-amber-400',
  ok:      'bg-white border-l-4 border-transparent',
};

function StatusBadge({ dateStr }: { dateStr: string }) {
  const d = daysUntil(dateStr);
  if (d < 0)  return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><X className="w-3 h-3" />Expired</span>;
  if (d === 0) return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" />Expires today</span>;
  if (d <= 3)  return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />{d}d left</span>;
  return null;
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
const inlineCls = 'w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
    catch { return []; }
  });

  const [form, setForm] = useState({ name: '', quantity: '', expiryDate: '' });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', quantity: '', expiryDate: '' });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim())     { setError('Item name is required.');  return; }
    if (!form.quantity.trim()) { setError('Quantity is required.');    return; }
    if (!form.expiryDate)      { setError('Expiry date is required.'); return; }
    setError('');
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: form.name.trim(), quantity: form.quantity.trim(), expiryDate: form.expiryDate },
    ]);
    setForm({ name: '', quantity: '', expiryDate: '' });
    nameRef.current?.focus();
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(item: GroceryItem) {
    setEditingId(item.id);
    setEditForm({ name: item.name, quantity: item.quantity, expiryDate: item.expiryDate });
  }

  function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.quantity.trim() || !editForm.expiryDate) return;
    setItems(prev => prev.map(i =>
      i.id === id
        ? { ...i, name: editForm.name.trim(), quantity: editForm.quantity.trim(), expiryDate: editForm.expiryDate }
        : i,
    ));
    setEditingId(null);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">

          {/* Heading */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-brand-50">
              <ShoppingCart className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Grocery List</h1>
              <p className="text-sm text-gray-500">Track items and their expiry dates</p>
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Item</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Item name *</label>
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="e.g. Milk"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                <input
                  type="text"
                  placeholder="e.g. 2 litres"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiry date *</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <button
              type="submit"
              className="mt-3 inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add to list
            </button>
          </form>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Expired</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Expiring within 3 days</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 inline-block" />Fresh</span>
          </div>

          {/* List */}
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Your grocery list is empty.</p>
              <p className="text-gray-400 text-xs mt-1">Add an item above to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide sr-only">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(item => {
                      const status = expiryStatus(item.expiryDate);
                      return (
                        <tr key={item.id} className={`${rowBg[status]} transition-colors`}>
                          {editingId === item.id ? (
                            <>
                              <td className="px-4 py-2">
                                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inlineCls} />
                              </td>
                              <td className="px-4 py-2">
                                <input type="text" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} className={inlineCls} />
                              </td>
                              <td className="px-4 py-2">
                                <input type="date" value={editForm.expiryDate} onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))} className={inlineCls} />
                              </td>
                              <td className="px-4 py-2" />
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => saveEdit(item.id)} title="Save" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingId(null)} title="Cancel" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                              <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(item.expiryDate)}</td>
                              <td className="px-4 py-3"><StatusBadge dateStr={item.expiryDate} /></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => startEdit(item)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(item.id)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                {items.length} {items.length === 1 ? 'item' : 'items'} · saved to browser storage
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
