import { createContext, useContext } from "react";

import { ProductCategory, ProductReigon, Product, Supplier, Reciever, Customer, } from "@/lib/interfaces/core";

interface AppData {
    customers: Customer[];
    suppliers: Supplier[];
    products: Product[];
    productCategories: ProductCategory[];
    productReigons: ProductReigon[];
    recievers: Reciever[];
}
interface DataContextType {
    data: AppData;
    updateCustomers: (newCustomers: Customer[]) => void;
    updateSuppliers: (newSuppliers: Supplier[]) => void;
}
const DataContext = createContext<DataContextType | undefined>(undefined);


export const DataProvider = ({ children }: { children: React.ReactNode }) => { }



export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}