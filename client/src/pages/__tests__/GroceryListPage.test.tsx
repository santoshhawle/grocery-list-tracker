import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import GroceryListPage from '../GroceryListPage';
import { createMockStorage } from '../../test/mockLocalStorage';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

// ─── localStorage mock ────────────────────────────────────────────────────────

const mockStorage = createMockStorage();

const BOUGHT_KEY = 'wbt_grocery_bought';
const LIST_KEY = 'grocery-list';

beforeEach(() => {
  mockStorage.clear();
  vi.stubGlobal('localStorage', mockStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  return render(<GroceryListPage />);
}

function addItem(name: string, quantity = '1 unit', expiryDate = '2099-12-31') {
  fireEvent.change(screen.getByPlaceholderText('e.g. Milk'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('e.g. 2 litres'), { target: { value: quantity } });
  fireEvent.change(screen.getByDisplayValue(''), { target: { value: expiryDate } });
  fireEvent.click(screen.getByRole('button', { name: /add to list/i }));
}

function getSection(title: RegExp | string) {
  return screen.getByRole('heading', { name: title }).closest('section') as HTMLElement;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GroceryListPage — initial render', () => {
  it('renders "To Buy" section heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /to buy/i })).toBeInTheDocument();
  });

  it('renders "Bought" section heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /bought/i })).toBeInTheDocument();
  });

  it('shows empty-state message in "To Buy" when no items', () => {
    renderPage();
    const toBuySection = getSection(/to buy/i);
    expect(within(toBuySection).getByText('No items yet. Add one above.')).toBeInTheDocument();
  });

  it('shows empty-state message in "Bought" when no bought items', () => {
    renderPage();
    const boughtSection = getSection(/^bought/i);
    expect(within(boughtSection).getByText('No bought items yet.')).toBeInTheDocument();
  });
});

describe('GroceryListPage — adding an item', () => {
  it('item appears in "To Buy" section after adding', () => {
    renderPage();
    addItem('Apples');
    const toBuySection = getSection(/to buy/i);
    expect(within(toBuySection).getByText('Apples')).toBeInTheDocument();
  });

  it('"To Buy" count badge updates to 1 after adding one item', () => {
    renderPage();
    addItem('Bananas');
    const toBuyHeading = screen.getByRole('heading', { name: /to buy/i });
    expect(toBuyHeading.textContent).toContain('1');
  });
});

describe('GroceryListPage — toggle to bought', () => {
  it('item moves from "To Buy" to "Bought" section when toggled', () => {
    renderPage();
    addItem('Milk');

    const toBuySectionBefore = getSection(/to buy/i);
    expect(within(toBuySectionBefore).getByText('Milk')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Milk as bought' }));

    const boughtSection = getSection(/^bought/i);
    expect(within(boughtSection).getByText('Milk')).toBeInTheDocument();

    const toBuySectionAfter = getSection(/to buy/i);
    expect(within(toBuySectionAfter).queryByText('Milk')).not.toBeInTheDocument();
  });

  it('count badges update correctly after toggle', () => {
    renderPage();
    addItem('Milk');
    addItem('Bread');

    fireEvent.click(screen.getByRole('button', { name: 'Mark Milk as bought' }));

    const toBuyHeading = screen.getByRole('heading', { name: /to buy/i });
    const boughtHeading = screen.getByRole('heading', { name: /^bought/i });

    expect(toBuyHeading.textContent).toContain('1');
    expect(boughtHeading.textContent).toContain('1');
  });

  it('wbt_grocery_bought in localStorage contains the item id after toggle', () => {
    renderPage();
    addItem('Eggs');

    fireEvent.click(screen.getByRole('button', { name: 'Mark Eggs as bought' }));

    const stored = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? '[]') as string[];
    expect(stored.length).toBe(1);
  });
});

describe('GroceryListPage — toggle back to unbought', () => {
  it('item moves back to "To Buy" section when toggled again', () => {
    renderPage();
    addItem('Cheese');

    fireEvent.click(screen.getByRole('button', { name: 'Mark Cheese as bought' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark Cheese as not bought' }));

    const toBuySection = getSection(/to buy/i);
    expect(within(toBuySection).getByText('Cheese')).toBeInTheDocument();

    const boughtSection = getSection(/^bought/i);
    expect(within(boughtSection).queryByText('Cheese')).not.toBeInTheDocument();
  });

  it('wbt_grocery_bought no longer contains the id after un-toggle', () => {
    renderPage();
    addItem('Yogurt');

    fireEvent.click(screen.getByRole('button', { name: 'Mark Yogurt as bought' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark Yogurt as not bought' }));

    const stored = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? '[]') as string[];
    expect(stored.length).toBe(0);
  });
});

describe('GroceryListPage — persistence round-trip', () => {
  it('item pre-populated in localStorage appears in "Bought" section on render', () => {
    const item = { id: 'pre-id-1', name: 'Butter', quantity: '200g', expiryDate: '2099-12-31' };
    mockStorage.setItem(LIST_KEY, JSON.stringify([item]));
    mockStorage.setItem(BOUGHT_KEY, JSON.stringify(['pre-id-1']));

    renderPage();

    const boughtSection = getSection(/^bought/i);
    expect(within(boughtSection).getByText('Butter')).toBeInTheDocument();
  });
});

describe('GroceryListPage — useRef mount guard', () => {
  it('does NOT write wbt_grocery_bought to localStorage on initial render', () => {
    renderPage();
    expect(mockStorage.getItem(BOUGHT_KEY)).toBeNull();
  });
});

describe('GroceryListPage — delete orphan cleanup', () => {
  it('deleting a bought item removes its id from wbt_grocery_bought', () => {
    renderPage();
    addItem('Orange');

    fireEvent.click(screen.getByRole('button', { name: 'Mark Orange as bought' }));

    const stored1 = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? '[]') as string[];
    expect(stored1.length).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const stored2 = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? '[]') as string[];
    expect(stored2.length).toBe(0);
  });

  it('deleting an unbought item does not affect wbt_grocery_bought', () => {
    renderPage();
    addItem('Pear');
    addItem('Grape');

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark Grape as bought' })[0]);

    const stored1 = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? '[]') as string[];
    expect(stored1.length).toBe(1);

    const pearDeleteBtns = within(getSection(/to buy/i)).getAllByRole('button', { name: 'Delete' });
    fireEvent.click(pearDeleteBtns[0]);

    const stored2 = JSON.parse(mockStorage.getItem(BOUGHT_KEY) ?? '[]') as string[];
    expect(stored2.length).toBe(1);
  });
});

describe('GroceryListPage — empty states', () => {
  it('shows "No items yet" in "To Buy" when all items are marked bought', () => {
    renderPage();
    addItem('Apple');

    fireEvent.click(screen.getByRole('button', { name: 'Mark Apple as bought' }));

    const toBuySection = getSection(/to buy/i);
    expect(within(toBuySection).getByText('No items yet. Add one above.')).toBeInTheDocument();
  });

  it('shows "No bought items yet" in "Bought" when no items are marked bought', () => {
    renderPage();
    addItem('Apple');

    const boughtSection = getSection(/^bought/i);
    expect(within(boughtSection).getByText('No bought items yet.')).toBeInTheDocument();
  });
});

describe('GroceryListPage — insertion order preservation (AC-03/AC-04)', () => {
  it('items A and C remain in insertion order in "To Buy" after middle item B is toggled', () => {
    renderPage();
    addItem('ItemA');
    addItem('ItemB');
    addItem('ItemC');

    fireEvent.click(screen.getByRole('button', { name: 'Mark ItemB as bought' }));

    const toBuySection = getSection(/to buy/i);
    const items = within(toBuySection).getAllByText(/Item[AC]/);
    expect(items[0].textContent).toBe('ItemA');
    expect(items[1].textContent).toBe('ItemC');
  });
});

describe('GroceryListPage — count badge accuracy', () => {
  it('displays "To Buy (2)" and "Bought (2)" with 4 items, 2 bought', () => {
    renderPage();
    addItem('Item1');
    addItem('Item2');
    addItem('Item3');
    addItem('Item4');

    fireEvent.click(screen.getByRole('button', { name: 'Mark Item1 as bought' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark Item2 as bought' }));

    const toBuyHeading = screen.getByRole('heading', { name: /to buy/i });
    const boughtHeading = screen.getByRole('heading', { name: /^bought/i });

    expect(toBuyHeading.textContent).toContain('2');
    expect(boughtHeading.textContent).toContain('2');
  });
});
