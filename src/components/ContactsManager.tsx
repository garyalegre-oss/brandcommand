'use client';

import React, { useState, useRef } from 'react';
import { Brand, Contact, ContactSource } from '../types/brand';
import { 
  Users, 
  Upload, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  Globe, 
  ShoppingBag, 
  CheckCircle2, 
  X, 
  Download, 
  Webhook, 
  Copy, 
  Check, 
  ShieldCheck 
} from 'lucide-react';

interface ContactsManagerProps {
  brand: Brand;
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  onImportBatch: (contacts: Omit<Contact, 'id' | 'createdAt'>[]) => void;
  onDeleteContact: (contactId: string) => void;
  onToggleStatus: (contactId: string) => void;
}

export function ContactsManager({
  brand,
  contacts,
  onAddContact,
  onImportBatch,
  onDeleteContact,
  onToggleStatus
}: ContactsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  // Add Contact Form State
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newSource, setNewSource] = useState<ContactSource>('manual');

  // CSV Drag & Drop State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<{ email: string; firstName?: string; lastName?: string; tags?: string }>>([]);
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Webhook copied state
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Filter contacts strictly belonging to active brand
  const brandContacts = contacts.filter((c) => c.brandId === brand.id);

  // Collect all unique tags for the active brand
  const allTags = Array.from(new Set(brandContacts.flatMap((c) => c.tags)));

  const filteredContacts = brandContacts.filter((c) => {
    const matchesSearch = 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'all' || c.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const subscribedCount = brandContacts.filter((c) => c.status === 'subscribed').length;

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    onAddContact({
      brandId: brand.id,
      email: newEmail.trim(),
      firstName: newFirstName.trim() || undefined,
      lastName: newLastName.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : ['#DirectLead'],
      source: newSource,
      status: 'subscribed'
    });

    setNewEmail('');
    setNewFirstName('');
    setNewLastName('');
    setNewTags('');
    setIsAddModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    processCsv(file);
  };

  const processCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setCsvError('CSV file must contain a header row and at least 1 contact.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
      const emailIdx = headers.findIndex((h) => h.includes('email'));
      const firstIdx = headers.findIndex((h) => h.includes('first') || h.includes('name'));
      const lastIdx = headers.findIndex((h) => h.includes('last'));
      const tagsIdx = headers.findIndex((h) => h.includes('tag'));

      if (emailIdx === -1) {
        setCsvError('Could not find an "email" column in your CSV header row.');
        return;
      }

      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const email = cols[emailIdx];
        if (email && email.includes('@')) {
          results.push({
            email,
            firstName: firstIdx !== -1 ? cols[firstIdx] : undefined,
            lastName: lastIdx !== -1 ? cols[lastIdx] : undefined,
            tags: tagsIdx !== -1 ? cols[tagsIdx] : undefined
          });
        }
      }

      setParsedRows(results);
      setCsvError('');
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = () => {
    if (parsedRows.length === 0) return;

    const formattedBatch = parsedRows.map((row) => ({
      brandId: brand.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      tags: row.tags
        ? row.tags.split(';').map((t) => (t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`))
        : ['#CsvImport', `#${brand.name.replace(/\s+/g, '')}`],
      source: 'csv' as ContactSource,
      status: 'subscribed' as const
    }));

    onImportBatch(formattedBatch);
    setIsCsvModalOpen(false);
    setCsvFile(null);
    setParsedRows([]);
  };

  const webhookUrl = `https://api.brandcommand.com/v1/webhooks/${brand.slug}/contacts`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const downloadSampleCsv = () => {
    const csvContent = `email,first_name,last_name,tags\nsarah.jenkins@gmail.com,Sarah,Jenkins,#VIPBuyer;#BlondeWefts\nmarcus.v@traders.com,Marcus,Vance,#OptionsTrader;#ProTier\nemily.davis@icloud.com,Emily,Davis,#SalonRegular`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${brand.slug}-sample-contacts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Brand Audience Header & Summary Stats */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {brand.name} Audience & Subscribers
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                Isolated List
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Only contacts imported or synced to <span className="font-semibold text-neutral-800 dark:text-neutral-200">{brand.name}</span> will receive this brand&apos;s email campaigns.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <Webhook className="w-3.5 h-3.5 text-blue-500" />
              Webhook Sync
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              Import CSV
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          </div>
        </div>

        {/* 3 Metric Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Total Contacts</span>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {brandContacts.length}
            </div>
            <span className="text-[11px] text-neutral-500">In this workspace</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Deliverable Status</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {brandContacts.length > 0 ? Math.round((subscribedCount / brandContacts.length) * 100) : 100}%
            </div>
            <span className="text-[11px] text-neutral-500">{subscribedCount} active subscribers</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Audience Tags</span>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {allTags.length}
            </div>
            <span className="text-[11px] text-neutral-500">Segments configured</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Contact Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or #tag..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tag Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedTag === 'all'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              All ({brandContacts.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedTag === tag
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                <th className="py-3 px-3">Subscriber</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Tags & Segments</th>
                {brand.category === 'extensions' || brand.category === 'salon' ? (
                  <th className="py-3 px-3">Spend</th>
                ) : null}
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400 text-xs">
                    No contacts found. Click &quot;Import CSV&quot; or &quot;Add Contact&quot; to populate your audience list.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {contact.firstName || contact.lastName
                          ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : contact.email.split('@')[0]}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">{contact.email}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize font-medium">
                        {contact.source === 'shopify' && <ShoppingBag className="w-3 h-3 text-emerald-500" />}
                        {contact.source === 'csv' && <FileText className="w-3 h-3 text-blue-500" />}
                        {contact.source === 'webhook' && <Webhook className="w-3 h-3 text-purple-500" />}
                        {contact.source === 'manual' && <Users className="w-3 h-3 text-neutral-500" />}
                        {contact.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {contact.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {brand.category === 'extensions' || brand.category === 'salon' ? (
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {contact.totalSpent || '$0.00'}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {contact.ordersCount || 0} orders
                        </div>
                      </td>
                    ) : null}

                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => onToggleStatus(contact.id)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                          contact.status === 'subscribed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:opacity-80'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:opacity-80'
                        }`}
                      >
                        {contact.status.toUpperCase()}
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onDeleteContact(contact.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                <Upload className="w-4 h-4 text-emerald-500" />
                Import CSV into {brand.name}
              </div>
              <button onClick={() => setIsCsvModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Upload a CSV file exported from Shopify, Vagaro, Square, or Google Sheets. The importer automatically detects the email, name, and tag columns.
            </p>

            {/* Dropzone Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-950/50 space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileText className="w-8 h-8 mx-auto text-neutral-400" />
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {csvFile ? csvFile.name : 'Click to select CSV file, or drag and drop here'}
              </div>
              <span className="text-[11px] text-neutral-400 block">
                Standard columns: email, first_name, last_name, tags
              </span>
            </div>

            {csvError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
                ⚠️ {csvError}
              </div>
            )}

            {parsedRows.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Ready to import {parsedRows.length} valid contacts
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Sample: {parsedRows[0].email} ({parsedRows[0].firstName || 'No name'})
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
              >
                <Download className="w-3 h-3" />
                Download CSV Template
              </button>

              <button
                type="button"
                disabled={parsedRows.length === 0}
                onClick={handleConfirmCsvImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-40 transition-colors"
              >
                Import {parsedRows.length} Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                Add Contact to {brand.name}
              </div>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase">First Name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Sarah"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Jenkins"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="#VIPClient, #BlondeExtensions, #InStore"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as ContactSource)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                >
                  <option value="manual">Manual Entry / Reception Desk</option>
                  <option value="shopify">Shopify Store Opt-In</option>
                  <option value="webhook">Website Signup Webhook</option>
                  <option value="csv">Imported List</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Save Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Sync Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                <Webhook className="w-4 h-4 text-purple-500" />
                Live Webhook Sync: {brand.name}
              </div>
              <button onClick={() => setIsWebhookModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Paste this webhook URL into your Shopify settings or custom web application to automatically sync new subscribers in real time.
            </p>

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Your Incoming Endpoint</span>
              <div className="flex items-center justify-between gap-2 font-mono text-xs bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 break-all">
                <span>{webhookUrl}</span>
                <button
                  onClick={copyWebhookUrl}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-bold block text-neutral-800 dark:text-neutral-200">
                How to connect in 60 seconds:
              </span>
              <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                <li><strong>For Shopify:</strong> Go to <em>Settings → Notifications → Webhooks → Create Webhook</em> (Event: <code>Customer creation</code>).</li>
                <li><strong>For OptionCove / Custom Apps:</strong> Send a <code>POST</code> JSON payload whenever a user signs up with <code>&#123; &quot;email&quot;: &quot;...&quot;, &quot;tags&quot;: [&quot;#ProUser&quot;] &#125;</code>.</li>
              </ol>
            </div>

            <button
              onClick={() => setIsWebhookModalOpen(false)}
              className="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
