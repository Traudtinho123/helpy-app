"use client";

import { Modal } from "@/components/ui/Modal";
import {
  CreateCustomerForm,
  type CreateCustomerFormDefaults,
} from "@/features/customers/components/create-customer-form";
import type { Customer } from "@/features/customers/mock/mock-customers";

type CreateCustomerModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
  defaults?: CreateCustomerFormDefaults;
  title?: string;
};

export function CreateCustomerModal({
  open,
  onClose,
  onCreated,
  defaults,
  title = "Neuen Kunden anlegen",
}: CreateCustomerModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth="md">
      <CreateCustomerForm
        defaults={defaults}
        onCancel={onClose}
        onSuccess={(customer) => {
          onCreated(customer);
          onClose();
        }}
      />
    </Modal>
  );
}
