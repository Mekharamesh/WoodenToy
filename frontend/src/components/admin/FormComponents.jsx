import React from 'react';
import { X } from 'lucide-react';
import { Button } from './CommonComponents';

export const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    footer = null, 
    size = 'md',
    className = ''
}) => {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className={`bg-white rounded-lg shadow-lg w-11/12 ${sizes[size]} ${className}`}>
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
                {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
            </div>
        </div>
    );
};

export const Form = ({ onSubmit, children, className = '' }) => {
    return (
        <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
            {children}
        </form>
    );
};

export const FormGroup = ({ label, required = false, error = '', children }) => {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            {children}
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
    );
};

export const Input = React.forwardRef(({
    type = 'text',
    placeholder = '',
    className = '',
    error = false,
    ...props
}, ref) => {
    return (
        <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
            } ${className}`}
            {...props}
        />
    );
});
Input.displayName = 'Input';

export const Select = React.forwardRef(({
    options = [],
    placeholder = 'Select...',
    className = '',
    error = false,
    ...props
}, ref) => {
    return (
        <select
            ref={ref}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
            } ${className}`}
            {...props}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
});
Select.displayName = 'Select';

export const Textarea = React.forwardRef(({
    placeholder = '',
    rows = 4,
    className = '',
    error = false,
    ...props
}, ref) => {
    return (
        <textarea
            ref={ref}
            placeholder={placeholder}
            rows={rows}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-vertical ${
                error ? 'border-red-500' : 'border-gray-300'
            } ${className}`}
            {...props}
        />
    );
});
Textarea.displayName = 'Textarea';

export const Checkbox = React.forwardRef(({
    label = '',
    className = '',
    ...props
}, ref) => {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                ref={ref}
                type="checkbox"
                className={`w-4 h-4 text-amber-700 rounded focus:ring-amber-500 ${className}`}
                {...props}
            />
            {label && <span className="text-sm text-gray-700">{label}</span>}
        </label>
    );
});
Checkbox.displayName = 'Checkbox';

export const RadioGroup = ({ options = [], name, className = '' }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {options.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        className="w-4 h-4 text-amber-700 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                </label>
            ))}
        </div>
    );
};

export default {
    Modal,
    Form,
    FormGroup,
    Input,
    Select,
    Textarea,
    Checkbox,
    RadioGroup,
};
