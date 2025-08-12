"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Users, UserCheck, Truck, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { SupplierModal } from "@/components/modals/supplier-modal";
import { CustomerModal } from "@/components/modals/customer-modal";
import { ReceiverModal } from "@/components/modals/receiver-modal";
import { ShippingCompanyModal } from "@/components/modals/shipping-company-modal";
import { useCoreData } from "@/lib/core-data-context";
import { Supplier, Customer, Receiver, ShippingCompany } from "@/lib/interfaces/core";
import {
  createSupplier, updateSupplier, deleteSupplier,
  createCustomer, updateCustomer, deleteCustomer,
  createReceiver, updateReceiver, deleteReceiver,
  createShippingCompany, updateShippingCompany, deleteShippingCompany
} from "@/lib/api/core";
import { getPartyDisplayName } from "@/lib/utils/party-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PartiesPage() {
  const t = useTranslations("parties_page");
  const { suppliers, customers, receivers, shippingCompanies, refreshData } = useCoreData();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [editingShipping, setEditingShipping] = useState<ShippingCompany | null>(null);

  const handleDeleteSupplier = async (id: number) => {
    if (confirm(t("confirm_delete_supplier"))) {
      await deleteSupplier(id);
      refreshData("suppliers");
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm(t("confirm_delete_customer"))) {
      await deleteCustomer(id);
      refreshData("customers");
    }
  };

  const handleDeleteReceiver = async (id: number) => {
    if (confirm(t("confirm_delete_receiver"))) {
      await deleteReceiver(id);
      refreshData("receivers");
    }
  };

  const handleDeleteShipping = async (id: number) => {
    if (confirm(t("confirm_delete_shipping"))) {
      await deleteShippingCompany(id);
      refreshData("shippingCompanies");
    }
  };

  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t("title")}</h1>
      
      <div className="space-y-8">
        {/* Suppliers Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#f6d265]" />
              {t("suppliers")}
            </h2>
            <Button
              size="sm"
              className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              onClick={() => {
                setEditingSupplier(null);
                setShowSupplierModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("add_supplier")}
            </Button>
          </div>
          <div className="p-4">
            {suppliers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_suppliers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام/شرکت</TableHead>
                    <TableHead className="text-right">نوع</TableHead>
                    <TableHead className="text-right">کد اقتصادی</TableHead>
                    <TableHead className="text-right">تلفن</TableHead>
                    <TableHead className="text-right">آدرس</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{getPartyDisplayName(supplier)}</TableCell>
                      <TableCell>{supplier.supplier_type === "Corporate" ? "شرکتی" : "حقیقی"}</TableCell>
                      <TableCell>{supplier.economic_code}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setShowSupplierModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Customers Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#f6d265]" />
              {t("customers")}
            </h2>
            <Button
              size="sm"
              className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              onClick={() => {
                setEditingCustomer(null);
                setShowCustomerModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("add_customer")}
            </Button>
          </div>
          <div className="p-4">
            {customers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_customers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام/شرکت</TableHead>
                    <TableHead className="text-right">نوع</TableHead>
                    <TableHead className="text-right">کد اقتصادی</TableHead>
                    <TableHead className="text-right">تلفن</TableHead>
                    <TableHead className="text-right">آدرس</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{getPartyDisplayName(customer)}</TableCell>
                      <TableCell>{customer.customer_type === "Corporate" ? "شرکتی" : "حقیقی"}</TableCell>
                      <TableCell>{customer.economic_code}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCustomer(customer);
                              setShowCustomerModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Receivers Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#f6d265]" />
              {t("receivers")}
            </h2>
            <Button
              size="sm"
              className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              onClick={() => {
                setEditingReceiver(null);
                setShowReceiverModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("add_receiver")}
            </Button>
          </div>
          <div className="p-4">
            {receivers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_receivers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام/شرکت</TableHead>
                    <TableHead className="text-right">نوع</TableHead>
                    <TableHead className="text-right">کد سیستمی</TableHead>
                    <TableHead className="text-right">کد یکتا</TableHead>
                    <TableHead className="text-right">کد اقتصادی</TableHead>
                    <TableHead className="text-right">تلفن</TableHead>
                    <TableHead className="text-right">آدرس</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivers.map((receiver) => (
                    <TableRow key={receiver.id}>
                      <TableCell className="font-medium">{getPartyDisplayName(receiver)}</TableCell>
                      <TableCell>{receiver.receiver_type === "Corporate" ? "شرکتی" : "حقیقی"}</TableCell>
                      <TableCell>{receiver.system_id}</TableCell>
                      <TableCell>{receiver.unique_id}</TableCell>
                      <TableCell>{receiver.economic_code}</TableCell>
                      <TableCell>{receiver.phone}</TableCell>
                      <TableCell>{receiver.address}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingReceiver(receiver);
                              setShowReceiverModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteReceiver(receiver.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Shipping Companies Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Ship className="w-5 h-5 text-[#f6d265]" />
              {t("shipping_companies")}
            </h2>
            <Button
              size="sm"
              className="bg-[#f6d265] hover:bg-[#f5c842] text-black"
              onClick={() => {
                setEditingShipping(null);
                setShowShippingModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("add_shipping")}
            </Button>
          </div>
          <div className="p-4">
            {shippingCompanies.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_shipping")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام شرکت</TableHead>
                    <TableHead className="text-right">شخص تماس</TableHead>
                    <TableHead className="text-right">تلفن</TableHead>
                    <TableHead className="text-right">ایمیل</TableHead>
                    <TableHead className="text-right">آدرس</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippingCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.contact_person}</TableCell>
                      <TableCell>{company.phone}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>{company.address}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingShipping(company);
                              setShowShippingModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteShipping(company.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {showSupplierModal && (
        <SupplierModal
          initialData={editingSupplier || undefined}
          onSubmit={async (data) => {
            if (editingSupplier) {
              await updateSupplier(editingSupplier.id, data);
            } else {
              await createSupplier(data);
            }
            await refreshData("suppliers");
            setShowSupplierModal(false);
            setEditingSupplier(null);
          }}
          onClose={() => {
            setShowSupplierModal(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          initialData={editingCustomer || undefined}
          onSubmit={async (data) => {
            if (editingCustomer) {
              await updateCustomer(editingCustomer.id, data);
            } else {
              await createCustomer(data);
            }
            await refreshData("customers");
            setShowCustomerModal(false);
            setEditingCustomer(null);
          }}
          onClose={() => {
            setShowCustomerModal(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {showReceiverModal && (
        <ReceiverModal
          initialData={editingReceiver || undefined}
          onSubmit={async (data) => {
            if (editingReceiver) {
              await updateReceiver(editingReceiver.id, data);
            } else {
              await createReceiver(data);
            }
            await refreshData("receivers");
            setShowReceiverModal(false);
            setEditingReceiver(null);
          }}
          onClose={() => {
            setShowReceiverModal(false);
            setEditingReceiver(null);
          }}
        />
      )}

      {showShippingModal && (
        <ShippingCompanyModal
          initialData={editingShipping || undefined}
          onSubmit={async (data) => {
            if (editingShipping) {
              await updateShippingCompany(editingShipping.id, data);
            } else {
              await createShippingCompany(data);
            }
            await refreshData("shippingCompanies");
            setShowShippingModal(false);
            setEditingShipping(null);
          }}
          onClose={() => {
            setShowShippingModal(false);
            setEditingShipping(null);
          }}
        />
      )}
    </div>
  );
}