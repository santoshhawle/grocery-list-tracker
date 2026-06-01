import type { GroceryItem } from '../../types';
import GroceryItemRow from './GroceryItemRow';

type SectionItem = GroceryItem & { bought: boolean };

interface GrocerySectionProps {
  title: string;
  items: SectionItem[];
  emptyMessage: string;
  onToggle: (id: string) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editForm: { name: string; quantity: string; expiryDate: string };
  inlineCls: string;
  onEditChange: (f: { name: string; quantity: string; expiryDate: string }) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}

export default function GrocerySection({
  title,
  items,
  emptyMessage,
  onToggle,
  onEdit,
  onDelete,
  editingId,
  editForm,
  inlineCls,
  onEditChange,
  onSave,
  onCancel,
}: GrocerySectionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        {title}{' '}
        <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-medium rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">{emptyMessage}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(item => (
              <GroceryItemRow
                key={item.id}
                item={item}
                bought={item.bought}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                editingId={editingId}
                editForm={editForm}
                inlineCls={inlineCls}
                onEditChange={onEditChange}
                onSave={onSave}
                onCancel={onCancel}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
