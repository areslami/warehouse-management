'use client';

import React, { createContext, useContext, useState, type ReactNode, type ElementType, type ComponentProps } from 'react';

type ModalProps<T extends ElementType> = ComponentProps<T>;

interface Modal {
    id: string;
    component: ElementType;
    props: Record<string, unknown>;
}

interface ModalContextType {
    openModal: <T extends ElementType>(component: T, props?: ModalProps<T>) => void;
    closeModal: (id?: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
    const [modals, setModals] = useState<Modal[]>([]);

    const openModal = <T extends ElementType>(component: T, props: ModalProps<T> = {} as ModalProps<T>) => {
        const id = Date.now().toString();
        setModals(prevModals => [...prevModals, { id, component, props }]);
    };

    const closeModal = (id?: string) => {
        if (id) {
            setModals(prevModals => prevModals.filter(modal => modal.id !== id));
        } else {
            // Close the most recent modal
            setModals(prevModals => prevModals.slice(0, -1));
        }
    };

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            {modals.map((modal) => (
                <div key={modal.id} style={{ position: 'relative', zIndex: 1000 + modals.indexOf(modal) }}>
                    {React.createElement(modal.component, {
                        ...modal.props,
                        onClose: () => {
                            // Call the original onClose if it exists
                            const originalOnClose = modal.props?.onClose;
                            if (typeof originalOnClose === 'function') {
                                originalOnClose();
                            }
                            closeModal(modal.id);
                        }
                    })}
                </div>
            ))}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};