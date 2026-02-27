'use client';

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Role } from '@/types';
import { addUser } from '@/lib/userStore';

const ROLES = [
  { value: Role.STORE,                label: 'Store Manager' },
  { value: Role.PROPERTY_COORDINATOR, label: 'Property Coordinator' },
  { value: Role.OPS_MANAGER,          label: 'Ops Manager' },
  { value: Role.EXEC,                 label: 'Executive' },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserModal({ onClose, onSuccess }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [role,      setRole]      = useState<Role | ''>('');
  const [phone,     setPhone]     = useState('');
  const [saving,    setSaving]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setSaving(true);
    try {
      const result = addUser({ firstName, lastName, email, role, phone: phone || undefined });
      if (!result) {
        toast.error('A user with this email already exists');
        return;
      }
      toast.success(`${firstName} ${lastName || ''} added successfully`);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <UserPlus size={16} className="text-brand-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Add User</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input w-full"
                required
                autoFocus
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input w-full"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              required
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="input w-full"
              required
            >
              <option value="">Select role…</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input w-full"
              placeholder="+27 82 000 0000"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding…</>
                : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
