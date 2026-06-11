import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type CustomSelectOption = {
  label: string
  value: string
}

export function CustomSelect({
  defaultValue,
  name,
  onChange,
  options,
  required,
  searchable,
  value,
}: {
  defaultValue?: string
  name?: string
  onChange?: (value: string) => void
  options: CustomSelectOption[]
  required?: boolean
  searchable?: boolean
  value?: string
}) {
  const generatedId = useId()
  const listboxId = `${generatedId}-listbox`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '')
  const selectedValue = value ?? internalValue
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? options[0],
    [options, selectedValue],
  )

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options
    const lower = query.toLowerCase()
    return options.filter((option) => option.label.toLowerCase().includes(lower))
  }, [options, query, searchable])

  const selectedIndex = Math.max(
    0,
    filteredOptions.findIndex((option) => option.value === selectedValue),
  )

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      return
    }

    if (searchable) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen, searchable])

  function commitValue(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function moveSelection(direction: 1 | -1) {
    if (!filteredOptions.length) return
    const nextIndex = (selectedIndex + direction + filteredOptions.length) % filteredOptions.length
    commitValue(filteredOptions[nextIndex].value)
  }

  return (
    <div className="custom-select">
      {name && (
        <input
          aria-hidden="true"
          className="custom-select-input"
          name={name}
          onInvalid={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
            setIsOpen(true)
          }}
          readOnly
          required={required}
          tabIndex={-1}
          type="text"
          value={selectedValue}
        />
      )}
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="custom-select-trigger"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false)
            return
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!isOpen) { setIsOpen(true); return }
            moveSelection(1)
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!isOpen) { setIsOpen(true); return }
            moveSelection(-1)
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span>{selectedOption?.label ?? 'Select'}</span>
      </button>
      {isOpen && (
        <div className="custom-select-menu" id={listboxId} ref={menuRef} role="listbox" tabIndex={-1}>
          {searchable && (
            <div className="custom-select-search">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search dresses…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') { setIsOpen(false); return }
                  if (event.key === 'ArrowDown') { event.preventDefault(); moveSelection(1) }
                  if (event.key === 'ArrowUp') { event.preventDefault(); moveSelection(-1) }
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    if (filteredOptions.length) commitValue(filteredOptions[selectedIndex]?.value ?? filteredOptions[0].value)
                  }
                }}
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <p className="custom-select-empty">No dresses found</p>
          ) : (
            filteredOptions.map((option) => (
              <button
                aria-selected={option.value === selectedValue}
                className={option.value === selectedValue ? 'selected' : ''}
                key={option.value}
                onClick={() => commitValue(option.value)}
                role="option"
                type="button"
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
