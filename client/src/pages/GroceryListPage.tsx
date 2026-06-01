import { useState, useEffect, useRef } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import type { GroceryItem } from '../types';
import * as groceryStorage from '../services/groceryStorage';
import GrocerySection from './grocery/GrocerySection';

const STORAGE_KEY = 'grocery-list';

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
  const [boughtIds, setBoughtIds] = useState<Set<string>>(() => groceryStorage.loadBoughtIds());
  const nameRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error(error);
    }
  }, [items]);

  useEffect(() => {
    // skip first fire — initial state is loaded from storage, not saved back
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    groceryStorage.saveBoughtIds(boughtIds);
  }, [boughtIds]);

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
    setBoughtIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  function handleToggleBought(id: string) {
    setBoughtIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const toBuyItems = items
    .filter(i => !boughtIds.has(i.id))
    .map(i => ({ ...i, bought: false as const }));

  const boughtItems = items
    .filter(i => boughtIds.has(i.id))
    .map(i => ({ ...i, bought: true as const }));

  const sharedSectionProps = {
    editingId,
    editForm,
    inlineCls,
    onEditChange: (f: { name: string; quantity: string; expiryDate: string }) => setEditForm(f),
    onSave: saveEdit,
    onCancel: () => setEditingId(null),
  };

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
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Expired</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Expiring within 3 days</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 inline-block" />Fresh</span>
          </div>

          {/* Two-section layout */}
          <GrocerySection
            title="To Buy"
            items={toBuyItems}
            emptyMessage="No items yet. Add one above."
            onToggle={handleToggleBought}
            onEdit={startEdit}
            onDelete={handleDelete}
            {...sharedSectionProps}
          />

          <div className="mt-6">
            <GrocerySection
              title="Bought"
              items={boughtItems}
              emptyMessage="No bought items yet."
              onToggle={handleToggleBought}
              onEdit={startEdit}
              onDelete={handleDelete}
              {...sharedSectionProps}
            />
          </div>
        </div>
      </main>
    </>
  );
}
