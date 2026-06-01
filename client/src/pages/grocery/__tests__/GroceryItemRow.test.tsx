import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroceryItemRow from '../GroceryItemRow';
import type { GroceryItem } from '../../../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ITEM: GroceryItem = {
  id: 'item-1',
  name: 'Milk',
  quantity: '2 litres',
  expiryDate: '2099-12-31',
};

const defaultProps = {
  item: ITEM,
  bought: false,
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  editingId: null,
  editForm: { name: '', quantity: '', expiryDate: '' },
  inlineCls: 'inline-edit',
  onEditChange: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Render ───────────────────────────────────────────────────────────────────

describe('GroceryItemRow — rendering', () => {
  it('renders item name', () => {
    render(<GroceryItemRow {...defaultProps} />);
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });

  it('renders item quantity', () => {
    render(<GroceryItemRow {...defaultProps} />);
    expect(screen.getByText(/2 litres/)).toBeInTheDocument();
  });

  it('renders formatted expiry date', () => {
    render(<GroceryItemRow {...defaultProps} />);
    expect(screen.getByText(/31 Dec 2099/)).toBeInTheDocument();
  });
});

// ─── aria-label ───────────────────────────────────────────────────────────────

describe('GroceryItemRow — aria-label', () => {
  it('toggle button has "Mark Milk as bought" when bought === false', () => {
    render(<GroceryItemRow {...defaultProps} bought={false} />);
    expect(screen.getByRole('button', { name: 'Mark Milk as bought' })).toBeInTheDocument();
  });

  it('toggle button has "Mark Milk as not bought" when bought === true', () => {
    render(<GroceryItemRow {...defaultProps} bought={true} />);
    expect(screen.getByRole('button', { name: 'Mark Milk as not bought' })).toBeInTheDocument();
  });
});

// ─── Toggle interactions ───────────────────────────────────────────────────────

describe('GroceryItemRow — toggle interactions', () => {
  it('clicking the toggle button calls onToggle with the correct item id', () => {
    const onToggle = vi.fn();
    render(<GroceryItemRow {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark Milk as bought' }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith('item-1');
  });

  it('pressing Enter on the focused toggle button calls onToggle', async () => {
    const onToggle = vi.fn();
    render(<GroceryItemRow {...defaultProps} onToggle={onToggle} />);
    const toggleBtn = screen.getByRole('button', { name: 'Mark Milk as bought' });
    toggleBtn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith('item-1');
  });

  it('pressing Space on the focused toggle button calls onToggle', async () => {
    const onToggle = vi.fn();
    render(<GroceryItemRow {...defaultProps} onToggle={onToggle} />);
    const toggleBtn = screen.getByRole('button', { name: 'Mark Milk as bought' });
    toggleBtn.focus();
    await userEvent.keyboard(' ');
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith('item-1');
  });
});

// ─── Visual state ─────────────────────────────────────────────────────────────

describe('GroceryItemRow — visual state', () => {
  it('when bought === true, item name has line-through class', () => {
    render(<GroceryItemRow {...defaultProps} bought={true} />);
    const nameEl = screen.getByText('Milk');
    expect(nameEl.className).toContain('line-through');
  });

  it('when bought === true, the row container has opacity-50 class', () => {
    const { container } = render(<GroceryItemRow {...defaultProps} bought={true} />);
    const rowDiv = container.firstChild as HTMLElement;
    expect(rowDiv.className).toContain('opacity-50');
  });

  it('when bought === false, item name does NOT have line-through class', () => {
    render(<GroceryItemRow {...defaultProps} bought={false} />);
    const nameEl = screen.getByText('Milk');
    expect(nameEl.className).not.toContain('line-through');
  });

  it('when bought === false, the row container does NOT have opacity-50 class', () => {
    const { container } = render(<GroceryItemRow {...defaultProps} bought={false} />);
    const rowDiv = container.firstChild as HTMLElement;
    expect(rowDiv.className).not.toContain('opacity-50');
  });
});

// ─── Touch target ─────────────────────────────────────────────────────────────

describe('GroceryItemRow — touch target', () => {
  it('toggle button has min-h-[44px] class for touch target compliance', () => {
    render(<GroceryItemRow {...defaultProps} />);
    const toggleBtn = screen.getByRole('button', { name: 'Mark Milk as bought' });
    expect(toggleBtn.className).toContain('min-h-[44px]');
  });

  it('toggle button has min-w-[44px] class for touch target compliance', () => {
    render(<GroceryItemRow {...defaultProps} />);
    const toggleBtn = screen.getByRole('button', { name: 'Mark Milk as bought' });
    expect(toggleBtn.className).toContain('min-w-[44px]');
  });
});
