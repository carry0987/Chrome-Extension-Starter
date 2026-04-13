import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/utils/cn';

const nativeSelectStyles = cva(
    'bg-input-background peer w-full appearance-none rounded-lg border border-base-300 px-4 py-2.5 pr-11 text-title-50 outline-none focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20 disabled:border-base-100 disabled:text-input-disabled-text disabled:placeholder:text-input-disabled-text',
    {
        variants: {
            variant: {
                default: '',
                error: 'border-input-error-focus-border focus:ring-input-error-focus-border/20',
                success: 'border-input-success-focus-border focus:ring-input-success-focus-border/20'
            }
        },
        defaultVariants: {
            variant: 'default'
        }
    }
);

type NativeSelectProps = React.ComponentProps<'select'> &
    VariantProps<typeof nativeSelectStyles> & {
        placeholder?: string;
    };

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
    ({ className, children, variant, placeholder, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <select ref={ref} className={cn(nativeSelectStyles({ variant }), className)} {...props}>
                    {placeholder && <NativeSelectOption hidden>{placeholder}</NativeSelectOption>}

                    {children}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-title-50">
                    <svg
                        className="h-5 w-5"
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
                </div>
            </div>
        );
    }
);
NativeSelect.displayName = 'NativeSelect';

const NativeSelectOption = React.forwardRef<HTMLOptionElement, React.ComponentProps<'option'>>(
    ({ className, ...props }, ref) => {
        return <option ref={ref} className={className} {...props} />;
    }
);
NativeSelectOption.displayName = 'NativeSelectOption';

const NativeSelectOptGroup = React.forwardRef<HTMLOptGroupElement, React.ComponentProps<'optgroup'>>(
    ({ className, ...props }, ref) => {
        return <optgroup ref={ref} className={className} {...props} />;
    }
);
NativeSelectOptGroup.displayName = 'NativeSelectOptGroup';

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
