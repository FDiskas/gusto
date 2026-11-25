import { useState } from 'react';
import type React from 'react';
import {
  Users,
  ExternalLink,
  X,
  Trash2,
  FolderOpen,
  UserPlus,
  Shield,
} from 'lucide-react';
import { useTranslate } from '@/i18n';
import { FOLDER_NAME } from '@/domain/constants';
import type { Collaborator } from '@/domain/types';

/** Family Sharing Modal (Google Drive Folder Permissions) */
export const FamilyShareModal: React.FC<{
  collaborators: Collaborator[];
  folderId: string | null;
  onInvite: (email: string, role: 'writer' | 'reader') => Promise<void>;
  onRemove: (permissionId: string) => Promise<void>;
  onClose: () => void;
}> = ({ collaborators, folderId, onInvite, onRemove, onClose }) => {
  const { t } = useTranslate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'writer' | 'reader'>('writer');
  const [submitting, setSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await onInvite(email.trim(), role);
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  const folderUrl = folderId
    ? `https://drive.google.com/drive/folders/${folderId}`
    : 'https://drive.google.com/drive/my-drive';

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md max-h-[88vh] bg-[#F8F7F2] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-xl">
        <div className="px-5 py-4 bg-white border-b border-[#E7E4DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#3E6B48]" />
            <h2 className="font-extrabold text-base text-[#1F2421]">{t('family.title')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F0E8] flex items-center justify-center text-[#3D453F] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          <div className="p-4 rounded-2xl bg-[#EBF1EA] border border-[#D4E3D3]">
            <p className="text-xs text-[#28422E] leading-relaxed mb-3">
              {t('family.subtitle', { folder: FOLDER_NAME })}
            </p>
            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#28422E] text-xs font-bold shadow-xs hover:bg-[#F8F7F2]"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#3E6B48]" />
              <span>{t('family.openFolder')}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="space-y-2.5">
            <label className="block text-xs font-bold text-[#3D453F]">{t('family.inviteLabel')}</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('family.invitePlaceholder')}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#DFDCD1] text-sm focus:outline-none focus:ring-2 focus:ring-[#3E6B48]"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'writer' | 'reader')}
                className="px-2.5 py-2.5 rounded-xl bg-white border border-[#DFDCD1] text-xs font-semibold text-[#2E3831] focus:outline-none"
              >
                <option value="writer">{t('family.role.writer')}</option>
                <option value="reader">{t('family.role.reader')}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#3E6B48] hover:bg-[#32583B] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('family.inviteBtn')}</span>
            </button>
          </form>

          {/* Collaborators List */}
          <div>
            <h3 className="text-xs font-bold text-[#5C655E] uppercase tracking-wider mb-2.5">
              {t('family.membersTitle', { count: collaborators.length })}
            </h3>
            <div className="space-y-2">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E7E4DA]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#E5EFE4] text-[#2D5436] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {(c.displayName || c.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1F2421] truncate">{c.displayName}</p>
                      <p className="text-xs text-[#6E7770] truncate">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.role === 'owner' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1EFE7] text-[11px] font-semibold text-[#5C655E]">
                        <Shield className="w-3 h-3" /> {t('family.owner')}
                      </span>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-[#EBF1EA] text-[11px] font-semibold text-[#3E6B48]">
                          {c.role === 'writer' ? t('family.role.writer') : t('family.role.reader')}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemove(c.id)}
                          className="p-1.5 rounded-lg text-[#8A928C] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title={t('family.remove')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
