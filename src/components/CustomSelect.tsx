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
  value,
}: {
  defaultValue?: string
  name?: string
  onChange?: (value: string) => void
  options: CustomSelectOption[]
  required?: boolean
  value?: string
}) {
  const generatedId = useId()
  const listboxId = `${generatedId}-listbox`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '')
  const selectedValue = value ?? internalValue
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  )
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? options[0],
    [options, selectedValue],
  )

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  function commitValue(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function moveSelection(direction: 1 | -1) {
    if (!options.length) return
    const nextIndex = (selectedIndex + direction + options.length) % options.length
    commitValue(options[nextIndex].value)
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
            if (!isOpen) {
              setIsOpen(true)
              return
            }
            moveSelection(1)
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!isOpen) {
              setIsOpen(true)
              return
            }
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
          {options.map((option) => (
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
          ))}
        </div>
      )}
    </div>
  )
}
