import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  SuperAdminSalesAgentApi,
  type CreateSalesAgentPayload,
} from '../services/superAdminSalesAgent.service';
import { superAdminSalesAgentKeys } from '@/services/queryKeys';
import { User, Mail, Phone, ShieldCheck } from 'lucide-react';

interface CreateSalesAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateSalesAgentModal: React.FC<CreateSalesAgentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateSalesAgentPayload>({
    name: '',
    email: '',
    mobileNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile number is required';
    } else if (formData.mobileNumber.trim().replace(/[^0-9]/g, '').length < 10) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateSalesAgentPayload) =>
      SuperAdminSalesAgentApi.createSalesAgent({
        name: payload.name.trim(),
        email: payload.email?.trim() || undefined,
        mobileNumber: payload.mobileNumber.trim(),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Sales agent created successfully.');
      queryClient.invalidateQueries({ queryKey: superAdminSalesAgentKeys.all });
      onClose();
      if (onSuccess) onSuccess();
      setFormData({
        name: '',
        email: '',
        mobileNumber: '',
      });
      setErrors({});
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create sales agent. Please try again.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate(formData);
  };

  const handleChange = (field: keyof CreateSalesAgentPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Sales Agent"
      description="Add a sales representative to manage field visits, lead pipeline, and institutional sales."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="sales-agent-name"
              data-testid="sales-agent-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                errors.name
                  ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                  : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
          </div>
          {errors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="sales-agent-mobile"
              data-testid="sales-agent-mobile-input"
              type="tel"
              required
              value={formData.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              placeholder="e.g. 9876543210"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                errors.mobileNumber
                  ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                  : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
          </div>
          {errors.mobileNumber && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{errors.mobileNumber}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Email Address (Optional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="sales-agent-email"
              data-testid="sales-agent-email-input"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="agent@example.com"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                errors.email
                  ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                  : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
              }`}
            />
          </div>
          {errors.email && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</p>}
        </div>

        {/* Informational Callout */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            Sales agents can instantly log into the platform using this <strong>mobile number</strong> via OTP verification or password.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending}
            data-testid="submit-create-sales-agent-button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            {createMutation.isPending ? 'Creating Agent...' : 'Create Sales Agent'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
