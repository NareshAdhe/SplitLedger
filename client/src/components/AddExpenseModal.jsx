import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function AddExpenseModal({ isOpen, onClose, group, onExpenseAdded }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    // For simplicity, building a quick equally-split logic among all members.
    // The user pays everything (contributions) and splits equally among all.
    const numAmount = Number(amount);
    const splitAmount = numAmount / group.members.length;
    
    // Pick the first member as the payer (ideally the logged in user, assuming the first member)
    const payerId = group.members[0].id;
    
    const contributions = [{ userId: payerId, amount: numAmount }];
    const splits = group.members.map(m => ({ userId: m.id, amount: splitAmount }));

    setIsSubmitting(true);
    try {
      await api.post('/expense', {
        groupId: group.id || parseInt(window.location.pathname.split('/').pop()),
        title,
        description: 'Added from web',
        amount: numAmount,
        contributions,
        splits
      });
      toast.success('Expense added!');
      onExpenseAdded();
      onClose();
      setTitle('');
      setAmount('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-5">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                    Add New Expense
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 outline-none"
                      placeholder="e.g. Dinner at place"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 outline-none"
                      placeholder="100.00"
                      min="1"
                      required
                    />
                  </div>

                  <div className="pt-2 text-sm text-gray-500 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    Currently, this simplifies by splitting equally among all members and paid completely by you.
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium shadow-md transition-all disabled:opacity-70"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Expense'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}