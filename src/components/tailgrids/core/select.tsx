import {
    type ComponentProps,
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useId,
    useRef,
    useState
} from 'react';
import { cn } from '@/utils/cn';
import { buttonStyles } from './button';

type SelectContextValue = {
    baseId: string;
    disabled?: boolean;
    name?: string;
    onChange?: (value: string) => void;
    open: boolean;
    rootRef: { current: HTMLDivElement | null };
    setOpen: (open: boolean) => void;
    value: string | null;
};

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(componentName: string) {
    const context = useContext(SelectContext);

    if (!context) {
        throw new Error(`${componentName} must be used within Select`);
    }

    return context;
}

function SelectChevronIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
            <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function SelectCheckIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
            <path
                d="M5 10.5L8.5 14L15 7.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function focusWithoutScroll(element: HTMLElement | null | undefined) {
    element?.focus({ preventScroll: true });
}

function focusOption(rootRef: { current: HTMLDivElement | null }, target: 'selected' | 'first') {
    const root = rootRef.current;

    if (!root) {
        return;
    }

    const options = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-select-option="true"]:not([disabled])'));

    if (options.length === 0) {
        return;
    }

    if (target === 'selected') {
        const selectedOption = options.find((option) => option.getAttribute('aria-selected') === 'true');

        if (selectedOption) {
            focusWithoutScroll(selectedOption);
            return;
        }
    }

    focusWithoutScroll(options[0]);
}

export type SelectProps = {
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    name?: string;
    onChange?: (value: string) => void;
    value: string | null;
};

export function Select({ children, className, disabled, name, onChange, value }: SelectProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const baseId = useId();

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    useEffect(() => {
        if (open) {
            focusOption(rootRef, 'selected');
        }
    }, [open, value]);

    return (
        <SelectContext.Provider value={{ baseId, disabled, name, onChange, open, rootRef, setOpen, value }}>
            <div ref={rootRef} className={cn('group relative flex w-full flex-col gap-2', className)}>
                {children}
                {name && value ? <input type="hidden" name={name} value={value} /> : null}
            </div>
        </SelectContext.Provider>
    );
}

type SelectLabelProps = ComponentProps<'span'>;

function SelectLabel({ className, ...props }: SelectLabelProps) {
    const { baseId } = useSelectContext('SelectLabel');

    return (
        <span
            id={`${baseId}-label`}
            className={cn('max-w-fit text-sm font-medium text-input-label-text select-none', className)}
            {...props}
        />
    );
}

type SelectDescriptionProps = ComponentProps<'p'>;

function SelectDescription({ className, ...props }: SelectDescriptionProps) {
    const { baseId } = useSelectContext('SelectDescription');

    return <p id={`${baseId}-description`} className={cn('text-sm font-normal text-text-50', className)} {...props} />;
}

type SelectTriggerProps = Omit<ComponentProps<'button'>, 'type'>;

function SelectTrigger({
    children,
    className,
    disabled: disabledProp,
    onClick,
    onKeyDown,
    ...props
}: SelectTriggerProps) {
    const { baseId, disabled, open, setOpen, rootRef } = useSelectContext('SelectTrigger');
    const isDisabled = disabled || disabledProp;

    return (
        <button
            type="button"
            id={`${baseId}-trigger`}
            aria-controls={`${baseId}-content`}
            aria-describedby={`${baseId}-description`}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-labelledby={`${baseId}-label ${baseId}-trigger`}
            className={cn(
                buttonStyles({
                    appearance: 'outline'
                }),
                'justify-between p-2 pl-2.5 text-sm data-open:border-input-primary-focus-border data-open:ring-4 data-open:ring-input-primary-focus-border/20',
                className
            )}
            data-open={open || undefined}
            disabled={isDisabled}
            onClick={(event) => {
                onClick?.(event);

                if (!event.defaultPrevented && !isDisabled) {
                    setOpen(!open);
                }
            }}
            onKeyDown={(event) => {
                onKeyDown?.(event);

                if (event.defaultPrevented || isDisabled) {
                    return;
                }

                if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setOpen(true);
                    window.setTimeout(() => focusOption(rootRef, 'selected'), 0);
                }
            }}
            {...props}>
            {children}
        </button>
    );
}
SelectTrigger.displayName = 'SelectTrigger';

type SelectValueProps = ComponentProps<'span'> & {
    placeholder?: string;
};

function SelectValue({ children, className, placeholder, ...props }: SelectValueProps) {
    const hasValue = children !== undefined && children !== null && children !== '';

    return (
        <span
            className={cn('truncate text-left', !hasValue && 'text-input-placeholder-text', className)}
            data-placeholder={hasValue ? undefined : true}
            {...props}>
            {hasValue ? children : placeholder}
        </span>
    );
}

function SelectIndicator({ children, className, ...props }: ComponentProps<'span'>) {
    const { open } = useSelectContext('SelectIndicator');

    return (
        <span
            aria-hidden="true"
            className={cn('ml-2 shrink-0 text-text-100 transition-transform', open && 'rotate-180', className)}
            {...props}>
            {children ?? <SelectChevronIcon className="size-4" />}
        </span>
    );
}

type SelectContentProps = ComponentProps<'div'>;

function SelectContent({ children, className, onKeyDown, ...props }: SelectContentProps) {
    const { baseId, open, rootRef, setOpen } = useSelectContext('SelectContent');

    if (!open) {
        return null;
    }

    return (
        <div
            id={`${baseId}-content`}
            role="listbox"
            tabIndex={-1}
            className={cn(
                'bg-dropdown-background absolute top-full z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-base-100 p-1 shadow-md',
                className
            )}
            onKeyDown={(event) => {
                onKeyDown?.(event);

                if (event.defaultPrevented) {
                    return;
                }

                const options = Array.from(
                    rootRef.current?.querySelectorAll<HTMLButtonElement>(
                        '[data-select-option="true"]:not([disabled])'
                    ) ?? []
                );

                if (options.length === 0) {
                    return;
                }

                const activeOption =
                    document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
                const currentIndex = activeOption ? options.indexOf(activeOption) : -1;

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    options[(currentIndex + 1 + options.length) % options.length]?.focus();
                    return;
                }

                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    options[(currentIndex - 1 + options.length) % options.length]?.focus();
                    return;
                }

                if (event.key === 'Home') {
                    event.preventDefault();
                    options[0]?.focus();
                    return;
                }

                if (event.key === 'End') {
                    event.preventDefault();
                    options[options.length - 1]?.focus();
                    return;
                }

                if (event.key === 'Escape') {
                    event.preventDefault();
                    setOpen(false);
                    window.setTimeout(() => {
                        focusWithoutScroll(document.getElementById(`${baseId}-trigger`));
                    }, 0);
                }
            }}
            {...props}>
            {children}
        </div>
    );
}
SelectContent.displayName = 'SelectContent';

type SelectItemProps = Omit<ComponentProps<'button'>, 'children' | 'id' | 'type'> & {
    children: ReactNode;
    id: string;
    textValue?: string;
};

function SelectItem({ children, className, id, onClick, textValue: _textValue, ...props }: SelectItemProps) {
    const { baseId, onChange, setOpen, value } = useSelectContext('SelectItem');
    const isSelected = value === id;

    return (
        <button
            type="button"
            id={`${baseId}-option-${id}`}
            role="option"
            aria-selected={isSelected}
            data-select-option="true"
            className={cn(
                'text-text-50 hover:bg-dropdown-hover-background hover:text-title-50 relative flex w-full items-center gap-3 rounded-md py-2 pl-3 pr-9 text-left text-sm outline-none transition',
                isSelected && 'bg-dropdown-hover-background text-title-50',
                'focus:bg-dropdown-hover-background focus:text-title-50',
                'disabled:pointer-events-none disabled:text-input-disabled-text',
                className
            )}
            onClick={(event) => {
                onClick?.(event);

                if (!event.defaultPrevented) {
                    onChange?.(id);
                    setOpen(false);
                }
            }}
            {...props}>
            <span className="truncate">{children}</span>
            {isSelected && (
                <span className="absolute right-3 flex size-5 items-center justify-center text-title-50">
                    <SelectCheckIcon className="size-4" />
                </span>
            )}
        </button>
    );
}
SelectItem.displayName = 'SelectItem';

export { SelectContent, SelectDescription, SelectIndicator, SelectItem, SelectLabel, SelectTrigger, SelectValue };
