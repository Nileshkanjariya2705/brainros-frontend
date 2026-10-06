import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  SuperAdminSalesAgentApi,
  type SalesAgentListItem,
  type SalesAgentDetail,
  type UpdateSalesAgentPayload,
} from '../services/superAdminSalesAgent.service';
import { superAdminSalesAgentKeys } from '@/services/queryKeys';
import { User, Mail, Phone, BadgeCheck, MapPin, Calendar, Activity } from 'lucide-react';

interface EditSalesAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: SalesAgentListItem | SalesAgentDetail | null;
  onSuccess?: () => void;
}

export const EditSalesAgentModal: React.FC<EditSalesAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UpdateSalesAgentPayload>({
    name: '',
    email: '',
    mobileNumber: '',
    employeeId: '',
    address: '',
    dateOfJoining: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
        mobileNumber: agent.mobileNumber || '',
        employeeId: agent.employeeId || '',
        address: (agent as SalesAgentDetail).address || '',
        dateOfJoining: (agent as SalesAgentDetail).dateOfJoining
          ? new Date((agent as SalesAgentDetail).dateOfJoining!).toISOString().split('T')[0]
          : '',
        status: agent.status || 'ACTIVE',
      });
      setErrors({});
    }
  }, [agent]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (formData.name && !formData.name.trim()) errs.name = 'Name cannot be empty';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (formData.mobileNumber && formData.mobileNumber.trim().length < 10) {
      errs.mobileNumber = 'Mobile number must be at least 10 digits';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSalesAgentPayload) => {
      if (!agent) throw new Error('No agent selected');
      return SuperAdminSalesAgentApi.updateSalesAgent(agent.id, {
        name: payload.name?.trim(),
        email: payload.email?.trim(),
        mobileNumber: payload.mobileNumber?.trim(),
        employeeId: payload.employeeId?.trim(),
        address: payload.address?.trim(),
        dateOfJoining: payload.dateOfJoining || undefined,
        status: payload.status,
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Sales agent updated successfully.');
      queryClient.invalidateQueries({ queryKey: superAdminSalesAgentKeys.all });
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update sales agent. Please try again.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof UpdateSalesAgentPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Sales Agent"
      description="Update profile, contact details, and account status for this sales agent."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="edit-sales-agent-name"
              data-testid="edit-sales-agent-name-input"
              type="text"
              required
              value={formData.name || ''}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="edit-sales-agent-email"
                data-testid="edit-sales-agent-email-input"
                type="email"
                required
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="edit-sales-agent-mobile"
                data-testid="edit-sales-agent-mobile-input"
                type="tel"
                required
                value={formData.mobileNumber || ''}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                placeholder="9876543210"
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Employee ID
            </label>
            <div className="relative">
              <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="edit-sales-agent-employee-id"
                data-testid="edit-sales-agent-employee-id-input"
                type="text"
                value={formData.employeeId || ''}
                onChange={(e) => handleChange('employeeId', e.target.value)}
                placeholder="e.g. SA-2026-001"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Status
            </label>
            <div className="relative">
              <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                id="edit-sales-agent-status"
                data-testid="edit-sales-agent-status-select"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Date of Joining
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="edit-sales-agent-joining-date"
                data-testid="edit-sales-agent-joining-date-input"
                type="date"
                value={formData.dateOfJoining || ''}
                onChange={(e) => handleChange('dateOfJoining', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Office / Field Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <textarea
              id="edit-sales-agent-address"
              data-testid="edit-sales-agent-address-input"
              rows={2}
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Assigned branch or headquarters address"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={updateMutation.isPending}
            data-testid="submit-edit-sales-agent-button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            {updateMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
