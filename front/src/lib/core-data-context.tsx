"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { ProductCategory, ProductRegion, Product, Supplier, Receiver, Customer, ShippingCompany, } from "@/lib/interfaces/core";
import { Warehouse } from "@/lib/interfaces/warehouse";
import { PurchaseProforma, SalesProforma } from "@/lib/interfaces/finance";
import {
    fetchCustomers, fetchSuppliers, fetchProducts, fetchProductCategories, fetchProductRegions, fetchReceivers, fetchShippingCompanies
} from "./api/core";
import { fetchWarehouses } from "./api/warehouse";
import { fetchPurchaseProformas, fetchSalesProformas } from "./api/finance";

interface AppData {
    customers: Customer[];
    suppliers: Supplier[];
    products: Product[];
    productCategories: ProductCategory[];
    productRegions: ProductRegion[];
    receivers: Receiver[];
    shippingCompanies: ShippingCompany[];
    warehouses: Warehouse[];
    purchaseProformas: PurchaseProforma[];
    salesProformas: SalesProforma[];
}

interface CoreContextType {
    data: AppData;
    updateData: <T extends keyof AppData>(key: T, newData: AppData[T]) => void;
    addItem: <T extends keyof AppData>(key: T, item: AppData[T][0]) => void;
    updateItem: <T extends keyof AppData>(key: T, id: number, updatedItem: Partial<AppData[T][0]>) => void;
    deleteItem: <T extends keyof AppData>(key: T, id: number) => void;
    refreshData: <T extends keyof AppData>(key: T) => Promise<void>;
}

const CoreContext = createContext<CoreContextType | undefined>(undefined);

// Global reference to context for API calls
let globalCoreContext: CoreContextType | undefined;


export const CoreDataProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<AppData>({
        customers: [],
        suppliers: [],
        products: [],
        productCategories: [],
        productRegions: [],
        receivers: [],
        shippingCompanies: [],
        warehouses: [],
        purchaseProformas: [],
        salesProformas: [],
    });
    const fetchInitialData = async () => {
        try {
            const [
                customers, suppliers, products, productCategories,
                productRegions, receivers, shippingCompanies, warehouses,
                purchaseProformas, salesProformas
            ] = await Promise.all([
                fetchCustomers(),
                fetchSuppliers(),
                fetchProducts(),
                fetchProductCategories(),
                fetchProductRegions(),
                fetchReceivers(),
                fetchShippingCompanies(),
                fetchWarehouses(),
                fetchPurchaseProformas().catch(() => null),
                fetchSalesProformas().catch(() => null),
            ]) as [
                    (Customer[] | null), (Supplier[] | null), (Product[] | null), (ProductCategory[] | null),
                    (ProductRegion[] | null), (Receiver[] | null), (ShippingCompany[] | null), (Warehouse[] | null),
                    (PurchaseProforma[] | null), (SalesProforma[] | null),
                ];


            setData({
                customers: customers || [],
                suppliers: suppliers || [],
                products: products || [],
                productCategories: productCategories || [],
                productRegions: productRegions || [],
                receivers: receivers || [],
                shippingCompanies: shippingCompanies || [],
                warehouses: warehouses || [],
                purchaseProformas: purchaseProformas || [],
                salesProformas: salesProformas || [],
            });

        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    };
    const updateData = <T extends keyof AppData>(key: T, newData: AppData[T]) => {
        setData(prevData => ({ ...prevData, [key]: newData }));
    };

    const addItem = <T extends keyof AppData>(key: T, item: AppData[T][0]) => {
        setData(prevData => ({
            ...prevData,
            [key]: [...prevData[key], item] as AppData[T]
        }));
    };

    const updateItem = <T extends keyof AppData>(key: T, id: number, updatedItem: Partial<AppData[T][0]>) => {
        setData(prevData => ({
            ...prevData,
            [key]: prevData[key].map((item: AppData[T][0]) =>
                (item as {id: number}).id === id ? { ...item, ...updatedItem } : item
            ) as AppData[T]
        }));
    };

    const deleteItem = <T extends keyof AppData>(key: T, id: number) => {
        setData(prevData => ({
            ...prevData,
            [key]: prevData[key].filter((item: AppData[T][0]) => (item as {id: number}).id !== id) as AppData[T]
        }));
    };

    const fetcherMap = {
        customers: fetchCustomers,
        suppliers: fetchSuppliers,
        products: fetchProducts,
        productCategories: fetchProductCategories,
        productRegions: fetchProductRegions,
        receivers: fetchReceivers,
        shippingCompanies: fetchShippingCompanies,
        warehouses: fetchWarehouses,
        purchaseProformas: fetchPurchaseProformas,
        salesProformas: fetchSalesProformas,
    };

    const refreshData = async <T extends keyof AppData>(key: T) => {
        try {
            const fetcher = fetcherMap[key];
            if (fetcher) {
                // Add error handling for finance endpoints specifically
                if (key === 'purchaseProformas' || key === 'salesProformas') {
                    const freshData = await fetcher().catch(() => null);
                    if (freshData) {
                        updateData(key, freshData as AppData[T]);
                    }
                } else {
                    const freshData = await fetcher();
                    if (freshData) {
                        updateData(key, freshData as AppData[T]);
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to refresh ${key}:`, error);
        }
    };

    const value = { data, updateData, addItem, updateItem, deleteItem, refreshData };

    // Set global reference
    globalCoreContext = value;

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


export const getCoreContext = () => globalCoreContext;