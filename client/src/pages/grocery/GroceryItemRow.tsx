import { Check, Pencil, Trash2, X } from 'lucide-react';
import type { GroceryItem } from '../../types';
import { expiryStatus, formatDate, rowBg, StatusBadge } from '../../utils/groceryUtils';

interface EditState {
  editingId: string | null;
  editForm: { name: string; quantity: string; expiryDate: string };
  inlineCls: string;
  onEditChange: (f: { name: string; quantity: string; expiryDate: string }) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}

interface GroceryItemRowProps extends EditState {
  item: GroceryItem;
  bought: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
}

export default function GroceryItemRow({
  item,
  bought,
  onToggle,
  onEdit,
  onDelete,
  editingId,
  editForm,
  inlineCls,
  onEditChange,
  onSave,
  onCancel,
}: GroceryItemRowProps) {
  const isEditing = editingId === item.id;
  const status = expiryStatus(item.expiryDate);
  const bgClass = bought ? 'bg-white border-l-4 border-transparent' : rowBg[status];

  const toggleLabel = bought
    ? `Mark ${item.name} as not bought`
    : `Mark ${item.name} as bought`;

  return (
    <div className={`${bgClass} px-4 py-3 flex items-start gap-3 transition-opacity duration-200 ${bought ? 'opacity-50' : ''}`}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-label={toggleLabel}
        className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border-2 transition-colors
          hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500
          border-gray-300 text-gray-400"
      >
        {bought && <Check className="w-5 h-5 text-brand-600" />}
      </button>

      {/* Content */}
      {isEditing ? (
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={editForm.name}
            onChange={e => onEditChange({ ...editForm, name: e.target.value })}
            className={inlineCls}
            aria-label="Item name"
          />
          <input
            type="text"
            value={editForm.quantity}
            onChange={e => onEditChange({ ...editForm, quantity: e.target.value })}
            className={inlineCls}
            aria-label="Quantity"
          />
          <input
            type="date"
            value={editForm.expiryDate}
            onChange={e => onEditChange({ ...editForm, expiryDate: e.target.value })}
            className={inlineCls}
            aria-label="Expiry date"
          />
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-gray-900 text-sm ${bought ? 'line-through' : ''}`}>
            {item.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {item.quantity} &middot; {formatDate(item.expiryDate)}
          </p>
          {!bought && (
            <div className="mt-1">
              <StatusBadge dateStr={item.expiryDate} />
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={() => onSave(item.id)}
              title="Save"
              aria-label="Save"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              title="Cancel"
              aria-label="Cancel"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(item)}
              title="Edit"
              aria-label="Edit"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              title="Delete"
              aria-label="Delete"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
