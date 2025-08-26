"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Users, UserCheck, Truck, Ship, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { handleApiError } from "@/lib/api/error-handler";
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
  const t = useTranslations("pages.parties");
  const tCommon = useTranslations("common");
  const { suppliers, customers, receivers, shippingCompanies, refreshData } = useCoreData();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [editingShipping, setEditingShipping] = useState<ShippingCompany | null>(null);


  const [searchTerm, setSearchTerm] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Supplier | Customer | Receiver | ShippingCompany | null>(null);
  const [selectedType, setSelectedType] = useState<'supplier' | 'customer' | 'receiver' | 'shipping'>('supplier');

  const handleDeleteSupplier = async (id: number) => {
    if (confirm(t("confirm_delete_supplier"))) {
      try {
        await deleteSupplier(id);
        toast.success(tCommon("toast_messages.delete_success"));
        refreshData("suppliers");
      } catch (error) {
        console.error("Failed to delete supplier:", error);
        const errorMessage = handleApiError(error, "Deleting supplier");
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm(t("confirm_delete_customer"))) {
      try {
        await deleteCustomer(id);
        toast.success(tCommon("toast_messages.delete_success"));
        refreshData("customers");
      } catch (error) {
        console.error("Failed to delete customer:", error);
        const errorMessage = handleApiError(error, "Deleting customer");
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteReceiver = async (id: number) => {
    if (confirm(t("confirm_delete_receiver"))) {
      try {
        await deleteReceiver(id);
        toast.success(tCommon("toast_messages.delete_success"));
        refreshData("receivers");
      } catch (error) {
        console.error("Failed to delete receiver:", error);
        const errorMessage = handleApiError(error, "Deleting receiver");
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteShipping = async (id: number) => {
    if (confirm(t("confirm_delete_shipping"))) {
      try {
        await deleteShippingCompany(id);
        toast.success(tCommon("toast_messages.delete_success"));
        refreshData("shippingCompanies");
      } catch (error) {
        console.error("Failed to delete shipping company:", error);
        const errorMessage = handleApiError(error, "Deleting shipping company");
        toast.error(errorMessage);
      }
    }
  };

  const handleRowClick = (item: Supplier | Customer | Receiver | ShippingCompany, type: 'supplier' | 'customer' | 'receiver' | 'shipping') => {
    setSelectedItem(item);
    setSelectedType(type);
    setSheetOpen(true);
  };

  const filteredSuppliers = useMemo(() =>
    suppliers.filter(s => getPartyDisplayName(s).toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.economic_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchTerm.toLowerCase()))
    , [suppliers, searchTerm]);

  const filteredCustomers = useMemo(() =>
    customers.filter(c => getPartyDisplayName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.economic_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchTerm.toLowerCase()))
    , [customers, searchTerm]);

  const filteredReceivers = useMemo(() =>
    receivers.filter(r => getPartyDisplayName(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.economic_code?.toLowerCase().includes(searchTerm.toLowerCase()))
    , [receivers, searchTerm]);

  const filteredShipping = useMemo(() =>
    shippingCompanies.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchTerm.toLowerCase()))
    , [shippingCompanies, searchTerm]);

  return (
    <div className="flex-1 p-6 min-h-screen bg-gray-50" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t("title")}</h1>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder={t("search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="space-y-8">
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
            {filteredSuppliers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_suppliers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{tCommon('table_headers.operations')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.address')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.phone')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.economic_code')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.type')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.name_company')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(supplier, 'supplier')}>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSupplier(supplier);
                              setShowSupplierModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSupplier(supplier.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.economic_code}</TableCell>
                      <TableCell>{supplier.supplier_type === "Corporate" ? tCommon('party_types.corporate') : tCommon('party_types.individual')}</TableCell>
                      <TableCell className="font-medium">{getPartyDisplayName(supplier)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

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
            {filteredCustomers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_customers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{tCommon('table_headers.operations')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.address')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.phone')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.economic_code')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.type')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.name_company')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(customer, 'customer')}>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCustomer(customer);
                              setShowCustomerModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(customer.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.economic_code}</TableCell>
                      <TableCell>{customer.customer_type === "Corporate" ? tCommon('party_types.corporate') : tCommon('party_types.individual')}</TableCell>
                      <TableCell className="font-medium">{getPartyDisplayName(customer)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

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
            {filteredReceivers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_receivers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{tCommon('table_headers.operations')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.address')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.phone')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.economic_code')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.unique_id')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.type')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.name_company')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivers.map((receiver) => (
                    <TableRow key={receiver.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(receiver, 'receiver')}>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingReceiver(receiver);
                              setShowReceiverModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReceiver(receiver.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{receiver.address}</TableCell>
                      <TableCell>{receiver.phone}</TableCell>
                      <TableCell>{receiver.economic_code}</TableCell>
                      <TableCell>{receiver.unique_id}</TableCell>
                      <TableCell>{receiver.receiver_type === "Corporate" ? tCommon('party_types.corporate') : tCommon('party_types.individual')}</TableCell>
                      <TableCell className="font-medium">{getPartyDisplayName(receiver)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

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
            {filteredShipping.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t("no_shipping")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{tCommon('table_headers.operations')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.address')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.email')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.phone')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.contact_person')}</TableHead>
                    <TableHead className="text-right">{tCommon('table_headers.company_name')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipping.map((company) => (
                    <TableRow key={company.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(company, 'shipping')}>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShipping(company);
                              setShowShippingModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShipping(company.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{company.address}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>{company.phone}</TableCell>
                      <TableCell>{company.contact_person}</TableCell>
                      <TableCell className="font-medium">{company.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto p-6" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-[#f6d265]">
              {selectedType === 'supplier' && tCommon('sheet_titles.supplier_details')}
              {selectedType === 'customer' && tCommon('sheet_titles.customer_details')}
              {selectedType === 'receiver' && tCommon('sheet_titles.receiver_details')}
              {selectedType === 'shipping' && tCommon('sheet_titles.shipping_details')}
            </SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedType === 'supplier') {
                      setEditingSupplier(selectedItem as Supplier);
                      setShowSupplierModal(true);
                    } else if (selectedType === 'customer') {
                      setEditingCustomer(selectedItem as Customer);
                      setShowCustomerModal(true);
                    } else if (selectedType === 'receiver') {
                      setEditingReceiver(selectedItem as Receiver);
                      setShowReceiverModal(true);
                    } else if (selectedType === 'shipping') {
                      setEditingShipping(selectedItem as ShippingCompany);
                      setShowShippingModal(true);
                    }
                    setSheetOpen(false);
                  }}
                >
                  <Edit2 className="h-4 w-4 ml-1" />
                  {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    const confirmMessage = selectedType === 'supplier' ? t("confirm_delete_supplier") :
                      selectedType === 'customer' ? t("confirm_delete_customer") :
                        selectedType === 'receiver' ? t("confirm_delete_receiver") :
                          t("confirm_delete_shipping");
                    if (confirm(confirmMessage)) {
                      try {
                        if (selectedType === 'supplier') {
                          await deleteSupplier(selectedItem.id);
                        } else if (selectedType === 'customer') {
                          await deleteCustomer(selectedItem.id);
                        } else if (selectedType === 'receiver') {
                          await deleteReceiver(selectedItem.id);
                        } else if (selectedType === 'shipping') {
                          await deleteShippingCompany(selectedItem.id);
                        }
                        toast.success(tCommon("toast_messages.delete_success"));
                        await refreshData(selectedType === 'shipping' ? 'shippingCompanies' : `${selectedType}s`);
                        setSheetOpen(false);
                      } catch (error) {
                        console.error("Failed to delete party:", error);
                        const errorMessage = handleApiError(error, "Deleting party");
                        toast.error(errorMessage);
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  {t("delete")}
                </Button>
              </div>
              <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                {(selectedType === 'supplier' || selectedType === 'customer' || selectedType === 'receiver') && (
                  <>
                    <div><strong>{tCommon('detail_labels.name')}</strong> {getPartyDisplayName(selectedItem)}</div>
                    <div><strong>{tCommon('table_headers.type')}</strong> {
                      selectedItem[`${selectedType}_type`] === "Corporate" ? tCommon('party_types.corporate') : tCommon('party_types.individual')
                    }</div>
                    {selectedItem[`${selectedType}_type`] === "Corporate" ? (
                      <>
                        <div><strong>{tCommon('detail_labels.company_name_label')}</strong> {selectedItem.company_name || '-'}</div>
                        <div><strong>{tCommon('detail_labels.national_id')}</strong> {selectedItem.national_id || '-'}</div>
                      </>
                    ) : (
                      <>
                        <div><strong>{tCommon('detail_labels.full_name')}</strong> {selectedItem.full_name || '-'}</div>
                        <div><strong>{tCommon('detail_labels.personal_code')}</strong> {selectedItem.personal_code || '-'}</div>
                      </>
                    )}
                    <div><strong>{tCommon('table_headers.economic_code')}</strong> {selectedItem.economic_code || '-'}</div>
                    <div><strong>{tCommon('table_headers.phone')}</strong> {selectedItem.phone || '-'}</div>
                    <div><strong>{tCommon('table_headers.address')}</strong> {selectedItem.address || '-'}</div>
                    {selectedItem.description && <div><strong>{tCommon('detail_labels.description')}</strong> {selectedItem.description}</div>}
                    {selectedType === 'receiver' && (
                      <>
                        <div><strong>{tCommon('detail_labels.unique_id_label')}</strong> {selectedItem.unique_id || '-'}</div>
                        {selectedItem.postal_code && <div><strong>{tCommon('detail_labels.postal_code')}</strong> {selectedItem.postal_code}</div>}
                      </>
                    )}
                    {selectedType === 'customer' && selectedItem.tags && (
                      <div><strong>{tCommon('detail_labels.tags')}</strong> {selectedItem.tags}</div>
                    )}
                  </>
                )}
                {selectedType === 'shipping' && (
                  <>
                    <div><strong>{tCommon('table_headers.company_name')}</strong> {selectedItem.name}</div>
                    <div><strong>{tCommon('detail_labels.contact_person_label')}</strong> {selectedItem.contact_person || '-'}</div>
                    <div><strong>{tCommon('table_headers.phone')}</strong> {selectedItem.phone || '-'}</div>
                    <div><strong>{tCommon('table_headers.email')}</strong> {selectedItem.email || '-'}</div>
                    <div><strong>{tCommon('table_headers.address')}</strong> {selectedItem.address || '-'}</div>
                    {selectedItem.description && <div><strong>{tCommon('detail_labels.description')}</strong> {selectedItem.description}</div>}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {showSupplierModal && (
        <SupplierModal
          initialData={editingSupplier || undefined}
          onSubmit={async (data) => {
            try {
              if (editingSupplier) {
                await updateSupplier(editingSupplier.id, data);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                await createSupplier(data);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await refreshData("suppliers");
              setShowSupplierModal(false);
              setEditingSupplier(null);
            } catch (error) {
              console.error("Failed to save supplier:", error);
              const errorMessage = handleApiError(error, editingSupplier ? "Updating supplier" : "Creating supplier");
              toast.error(errorMessage);
            }
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
            try {
              if (editingCustomer) {
                await updateCustomer(editingCustomer.id, data);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                await createCustomer(data);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await refreshData("customers");
              setShowCustomerModal(false);
              setEditingCustomer(null);
            } catch (error) {
              console.error("Failed to save customer:", error);
              const errorMessage = handleApiError(error, editingCustomer ? "Updating customer" : "Creating customer");
              toast.error(errorMessage);
            }
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
            try {
              if (editingReceiver) {
                await updateReceiver(editingReceiver.id, data);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                await createReceiver(data);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await refreshData("receivers");
              setShowReceiverModal(false);
              setEditingReceiver(null);
            } catch (error) {
              console.error("Failed to save receiver:", error);
              const errorMessage = handleApiError(error, editingReceiver ? "Updating receiver" : "Creating receiver");
              toast.error(errorMessage);
            }
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
            try {
              if (editingShipping) {
                await updateShippingCompany(editingShipping.id, data);
                toast.success(tCommon("toast_messages.update_success"));
              } else {
                await createShippingCompany(data);
                toast.success(tCommon("toast_messages.create_success"));
              }
              await refreshData("shippingCompanies");
              setShowShippingModal(false);
              setEditingShipping(null);
            } catch (error) {
              console.error("Failed to save shipping company:", error);
              const errorMessage = handleApiError(error, editingShipping ? "Updating shipping company" : "Creating shipping company");
              toast.error(errorMessage);
            }
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