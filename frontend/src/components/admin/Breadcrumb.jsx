import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = ({ items = [] }) => {
    if (items.length === 0) {
        items = [{ label: 'Admin', href: '/admin' }];
    }

    return (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
                    {item.href ? (
                        <a href={item.href} className="hover:text-amber-700 transition-colors">
                            {item.label}
                        </a>
                    ) : (
                        <span className="text-gray-900 font-medium">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export const PageHeader = ({ title, description = '', breadcrumbs = [], children }) => {
    return (
        <div className="mb-8">
            <Breadcrumb items={breadcrumbs} />
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                    {description && <p className="text-gray-600">{description}</p>}
                </div>
                {children}
            </div>
        </div>
    );
};

export default { Breadcrumb, PageHeader };
