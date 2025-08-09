'use client';

import React, { createContext, useContext, useState, type ReactNode, type ElementType, type ComponentProps } from 'react';

type ModalProps<T extends ElementType> = ComponentProps<T>;

interface ModalContextType {
    openModal: <T extends ElementType>(component: T, props?: ModalProps<T>) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
    const [modal, setModal] = useState<{ isOpen: boolean; component: ElementType | null; props: object }>({
        isOpen: false,
        component: null,
        props: {},
    });

    const openModal = <T extends ElementType>(component: T, props: ModalProps<T> = {} as ModalProps<T>) => {
        setModal({ isOpen: true, component, props });
    };

    const closeModal = () => {
        setModal({ isOpen: false, component: null, props: {} });
    };

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            {modal.isOpen && modal.component && React.createElement(modal.component, { ...modal.props, onClose: closeModal })}
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