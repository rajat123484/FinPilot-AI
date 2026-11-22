import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

const CATEGORIES = [
  'All',
  'Food',
  'Shopping',
  'Travel',
  'Education',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Salary',
  'Investments',
  'Miscellaneous',
];

export const TransactionsPage = ({ isModalOpen, setIsModalOpen }) => {
  const { formatCurrency, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('all');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Create Form State
  const [editingTx, setEditingTx] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Card',
    notes: '',
  });

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.transactions.list({
        page,
        page_size: pageSize,
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        type: type !== 'all' ? type : undefined,
        is_flagged: onlyFlagged ? true : undefined,
      });
      setTransactions(res.transactions || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page, category, type, onlyFlagged]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const handleOpenCreate = () => {
    setEditingTx(null);
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Card',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setFormData({
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: new Date(tx.date).toISOString().split('T')[0],
      payment_method: tx.payment_method || 'Card',
      notes: tx.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.transactions.delete(id);
        loadTransactions();
      } catch (err) {
        alert(err.message || 'Failed to delete transaction');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        payment_method: formData.payment_method,
        notes: formData.notes,
      };

      if (editingTx) {
        await api.transactions.update(editingTx.id, payload);
      } else {
        await api.transactions.create(payload);
      }

      setIsModalOpen(false);
      loadTransactions();
    } catch (err) {
      alert(err.message || 'Error saving transaction');
    }
  };

  const handleExportCsv = () => {
    window.open(api.transactions.getExportUrl(), '_blank');
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Action Header & Filter Controls */}
      <div className="fintech-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by merchant, description, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#091224] border border-[#1A2A4A] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#091224] border border-[#1A2A4A] text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-500 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Transaction</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#1A2A4A]/60 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 bg-[#091224] border border-[#1A2A4A] rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Type:</span>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 bg-[#091224] border border-[#1A2A4A] rounded-lg text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Flow</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Only Flagged Anomaly Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer ml-auto text-slate-300 font-medium select-none">
            <input
              type="checkbox"
              checked={onlyFlagged}
              onChange={(e) => { setOnlyFlagged(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded bg-[#091224] border-[#1A2A4A] text-blue-600 focus:ring-0 focus:ring-offset-0"
            />
            <span className="flex items-center gap-1 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" /> Flagged Anomalies Only
            </span>
          </label>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="fintech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091224] border-b border-[#1A2A4A] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Title / Merchant</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Risk Score</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2A4A]/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    No transactions match your active filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#0D182E]/90 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {new Date(tx.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-white">
                      <div>
                        <span>{tx.title}</span>
                        {tx.notes && (
                          <p className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{tx.notes}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#091224] text-slate-300 border border-[#1A2A4A]">
                        {tx.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-400">{tx.payment_method || 'Card'}</td>

                    <td className="px-5 py-3.5 font-mono font-bold">
                      <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}>
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {tx.is_flagged ? (
                        <Badge variant={tx.risk_level === 'HIGH' ? 'high' : 'medium'} size="xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{tx.risk_score} Risk</span>
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Normal</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(tx)}
                        title="Edit Transaction"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-[#1E293B] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        title="Delete Transaction"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#1E293B] transition-colors"
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

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-[#1A2A4A] flex items-center justify-between text-xs text-slate-400 bg-[#091224]">
          <span>
            Showing {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, total)} of {total} transactions
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-[#0D182E] border border-[#1A2A4A] text-slate-300 disabled:opacity-40 hover:bg-[#1E293B]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-medium text-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-[#0D182E] border border-[#1A2A4A] text-slate-300 disabled:opacity-40 hover:bg-[#1E293B]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTx ? 'Edit Transaction' : 'Record New Transaction'}
        subtitle="Automatic fraud anomaly screening will run upon saving"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Title / Merchant Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Whole Foods, Apple Store, Tech Salary"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Amount ({user?.currency || 'USD'})</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="45.50"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Flow Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white focus:outline-none focus:border-sky-500"
              >
                <option value="expense">Expense (Outflow)</option>
                <option value="income">Income (Inflow)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white focus:outline-none focus:border-sky-500"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Transaction Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer (ACH / Wire)</option>
                <option value="UPI">UPI / Digital Wallet</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Notes / Tag</label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#091224] border border-[#1A2A4A] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#1A2A4A] text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/25"
            >
              {editingTx ? 'Save Changes' : 'Confirm & Screen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
