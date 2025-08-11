"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Users, UserCheck, Truck, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  const getPartyName = (party: Supplier | Customer | Receiver | ShippingCompany) => {
    if ('company_name' in party && party.company_name) return party.company_name;
    if ('full_name' in party && party.full_name) return party.full_name;
    if ('name' in party && party.name) return party.name;
    return t("unnamed");
  };

  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t("title")}</h1>
      
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suppliers.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">{t("no_suppliers")}</p>
            ) : (
              suppliers.map((supplier) => (
                <Card key={supplier.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{getPartyName(supplier)}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">کد اقتصادی: {supplier.economic_code}</p>
                    <p className="text-sm text-gray-600">تلفن: {supplier.phone}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customers.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">{t("no_customers")}</p>
            ) : (
              customers.map((customer) => (
                <Card key={customer.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{getPartyName(customer)}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">کد اقتصادی: {customer.economic_code}</p>
                    <p className="text-sm text-gray-600">تلفن: {customer.phone}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {receivers.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">{t("no_receivers")}</p>
            ) : (
              receivers.map((receiver) => (
                <Card key={receiver.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{getPartyName(receiver)}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleDeleteReceiver(receiver.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">کد سیستمی: {receiver.system_id}</p>
                    <p className="text-sm text-gray-600">تلفن: {receiver.phone}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {shippingCompanies.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">{t("no_shipping")}</p>
            ) : (
              shippingCompanies.map((company) => (
                <Card key={company.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{company.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleDeleteShipping(company.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">شخص تماس: {company.contact_person}</p>
                    <p className="text-sm text-gray-600">تلفن: {company.phone}</p>
                  </CardContent>
                </Card>
              ))
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