import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, FocusEvent } from 'react';
import type { Patient } from '@/data/types';
import { Input } from '@/components/ui';
import { cn } from '@/lib/cn';

interface PatientPickerProps {
  patients: Patient[];
  value: string | null;
  onChange: (patientId: string) => void;
  id?: string;
  invalid?: boolean;
}

function fullName(patient: Patient): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

const MAX_RESULTS = 20;

/**
 * A lightweight searchable combobox over Input + a filtered list, not a new
 * Radix primitive — with ~60 seeded patients, a plain <Select> dropdown of
 * every name would be unwieldy to scan or type-ahead through.
 */
export function PatientPicker({ patients, value, onChange, id, invalid }: PatientPickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = patients.find((p) => p.id === value) ?? null;
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? patients.filter((p) => fullName(p).toLowerCase().includes(q)) : patients;
    return pool.slice(0, MAX_RESULTS);
  }, [patients, query]);

  const displayValue = isOpen ? query : selected ? fullName(selected) : '';

  function selectPatient(patient: Patient): void {
    onChange(patient.id);
    setQuery('');
    setIsOpen(false);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>): void {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsOpen(false);
      setQuery('');
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const match = matches[activeIndex];
      if (match) selectPatient(match);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <Input
        id={inputId}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        invalid={invalid}
        placeholder="Search patient by name…"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Patients"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-hairline bg-surface-base py-1 shadow-overlay"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-secondary">No patients match "{query}"</li>
          ) : (
            matches.map((patient, index) => (
              <li
                key={patient.id}
                role="option"
                aria-selected={patient.id === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectPatient(patient);
                }}
                className={cn(
                  'cursor-pointer px-3 py-1.5 text-sm text-ink-primary',
                  index === activeIndex ? 'bg-surface-sunken' : undefined,
                )}
              >
                {fullName(patient)}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
