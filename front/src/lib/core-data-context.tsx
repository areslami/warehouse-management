import { createContext, useContext, useEffect, useState } from "react";

import { ProductCategory, ProductReigon, Product, Supplier, Reciever, Customer, ShippingCompany, } from "@/lib/interfaces/core";

import {
    fetchCustomers, fetchSuppliers, fetchProducts, fetchProductCategories,
    fetchProductReigons, fetchRecievers, fetchShippingCompanies,
    createCustomer, createSupplier, createProduct, createProductCategory,
    createProductReigon, createReciever, createShippingCompany
} from '@/lib/api/core';

interface AppData {
    customers: Customer[];
    suppliers: Supplier[];
    products: Product[];
    productCategories: ProductCategory[];
    productReigons: ProductReigon[];
    recievers: Reciever[];
    shippingCompanies: ShippingCompany[];
}

interface CoreContextType {
    data: AppData;
    updateData: <T extends keyof AppData>(key: T, newData: AppData[T]) => void;
}

const CoreContext = createContext<CoreContextType | undefined>(undefined);


export const CoreDataProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<AppData>({
        customers: [],
        suppliers: [],
        products: [],
        productCategories: [],
        productReigons: [],
        recievers: [],
        shippingCompanies: [],
    });
    const fetchInitialData = async () => {
        try {
            const [
                customers, suppliers, products, productCategories,
                productReigons, recievers, shippingCompanies
            ] = await Promise.all([
                fetchCustomers(),
                fetchSuppliers(),
                fetchProducts(),
                fetchProductCategories(),
                fetchProductReigons(),
                fetchRecievers(),
                fetchShippingCompanies(),
            ]) as [
                    (Customer[] | null), (Supplier[] | null), (Product[] | null), (ProductCategory[] | null),
                    (ProductReigon[] | null), (Reciever[] | null), (ShippingCompany[] | null),
                ];


            setData({
                customers: customers || [],
                suppliers: suppliers || [],
                products: products || [],
                productCategories: productCategories || [],
                productReigons: productReigons || [],
                recievers: recievers || [],
                shippingCompanies: shippingCompanies || [],
            });

        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    };
    const updateData = <T extends keyof AppData>(key: T, newData: AppData[T]) => {
        setData(prevData => ({ ...prevData, [key]: newData }));
    };
    const value = { data, updateData };

    useEffect(() => {
        fetchInitialData();
    }, []);
    return (
        <CoreContext.Provider value={value}>
            {children}
        </CoreContext.Provider>
    );


}



export const useCoreData = () => {
    const context = useContext(CoreContext);
    if (context === undefined) {
        throw new Error('useCoreData must be used within a CoreDataProvider');
    }
    return context;
};