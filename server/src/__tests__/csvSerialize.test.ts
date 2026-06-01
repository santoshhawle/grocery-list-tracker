import { describe, it, expect } from 'vitest';
import { csvSerialize } from '../utils/csvSerialize';

const HEADERS = ['date', 'mood', 'energy', 'focus', 'notes', 'work_hours', 'name', 'email'];
const BOM = '\uFEFF';

describe('csvSerialize', () => {
  it('should start every output with a UTF-8 BOM', () => {
    const result = csvSerialize([], HEADERS);
    expect(result.charCodeAt(0)).toBe(0xfeff);
  });

  it('should return BOM + header row only when rows array is empty', () => {
    const result = csvSerialize([], HEADERS);
    expect(result).toBe(BOM + HEADERS.join(','));
  });

  it('should serialise a plain row correctly', () => {
    const rows = [
      { date: '2026-01-01', mood: 8, energy: 7, focus: 9, notes: 'Great day', work_hours: 8, name: 'Alice', email: 'alice@example.com' },
    ];
    const result = csvSerialize(rows, HEADERS);
    const lines = result.replace(BOM, '').split('\r\n');
    expect(lines[0]).toBe(HEADERS.join(','));
    expect(lines[1]).toBe('2026-01-01,8,7,9,Great day,8,Alice,alice@example.com');
  });

  it('should wrap notes containing commas in double-quotes', () => {
    const rows = [
      { date: '2026-01-02', mood: 5, energy: 5, focus: 5, notes: 'tired, sluggish', work_hours: 8, name: 'Bob', email: 'bob@example.com' },
    ];
    const result = csvSerialize(rows, HEADERS);
    expect(result).toContain('"tired, sluggish"');
  });

  it('should escape double-quotes inside notes by doubling them', () => {
    const rows = [
      { date: '2026-01-03', mood: 6, energy: 6, focus: 6, notes: 'Said "hello"', work_hours: 8, name: 'Carol', email: 'carol@example.com' },
    ];
    const result = csvSerialize(rows, HEADERS);
    expect(result).toContain('"Said ""hello"""');
  });

  it('should wrap notes containing newlines in double-quotes', () => {
    const rows = [
      { date: '2026-01-04', mood: 7, energy: 7, focus: 7, notes: 'line one\nline two', work_hours: 8, name: 'Dave', email: 'dave@example.com' },
    ];
    const result = csvSerialize(rows, HEADERS);
    expect(result).toContain('"line one\nline two"');
  });

  it('should prefix fields starting with = with a tab (CSV injection)', () => {
    const rows = [
      { date: '2026-01-05', mood: 5, energy: 5, focus: 5, notes: '=SUM(A1:A10)', work_hours: 8, name: 'Eve', email: 'eve@example.com' },
    ];
    const result = csvSerialize(rows, HEADERS);
    expect(result).toContain('\t=SUM(A1:A10)');
  });

  it('should prefix fields starting with + with a tab (CSV injection)', () => {
    const rows = [
      { date: '2026-01-06', mood: 5, energy: 5, focus: 5, notes: '+cmd|/C calc', work_hours: 8, name: 'Eve', email: 'eve@example.com' },
    ];
    const result = csvSerialize(rows, HEADERS);
    expect(result).toContain('\t+cmd|/C calc');
  });

  it('should treat null and undefined fields as empty strings', () => {
    const rows = [
      { date: '2026-01-07', mood: 5, energy: 5, focus: 5, notes: null, work_hours: undefined, name: 'Frank', email: 'frank@example.com' },
    ];
    const result = csvSerialize(rows, HEADERS);
    const dataLine = result.replace(BOM, '').split('\r\n')[1];
    // notes and work_hours should be empty (7 commas for 8 columns)
    expect(dataLine).toBe('2026-01-07,5,5,5,,,Frank,frank@example.com');
  });

  it('should use CRLF line endings between rows', () => {
    const rows = [
      { date: '2026-01-08', mood: 8, energy: 8, focus: 8, notes: '', work_hours: 8, name: 'Grace', email: 'grace@example.com' },
    ];
    const content = csvSerialize(rows, HEADERS).replace(BOM, '');
    expect(content).toContain('\r\n');
  });
});
