import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Users, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CircleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCircle();
  }, [id]);

  const fetchCircle = async () => {
    try {
      const res = await api.get(`/circle/${id}`);
      setCircle(res.data.circle);
    } catch (error) {
      toast.error('Failed to load circle');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin text-teal-600" size={48} />
      </div>
    );
  }
  
  if (!circle) return null;

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Circle Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl p-8 mb-8 text-white shadow-xl shadow-teal-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">{circle.title}</h1>
          <p className="text-teal-100 text-lg opacity-90">{circle.description || 'A cozy circle of friends'}</p>
        </div>
        <div className="flex items-center gap-4 bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20">
          <div className="text-center px-4">
            <p className="text-teal-100 text-sm font-semibold uppercase tracking-wider mb-1">Members</p>
            <p className="text-2xl font-bold">{circle.members?.length || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[400px]">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
          <Users className="text-teal-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Circle Members</h2>
        </div>
        
        {(!circle.members || circle.members.length === 0) ? (
          <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
             <Users size={48} className="mx-auto mb-4 opacity-30" />
             <p className="text-lg font-medium">No members yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {circle.members.map((m, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-teal-50/30 hover:border-teal-100 transition-colors group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-white shadow-inner text-3xl mb-4 group-hover:scale-105 transition-transform">
                  {m.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg flex items-center justify-center gap-2">
                     {m.name || `User ${m.id}`}
                     {m.id === user?.id && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}