import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { Users, Phone, Mail, DollarSign, Music } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  let leads: any[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (!error && data) {
        leads = data;
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 mt-1">Contact information from song requesters</p>
        </div>
        {leads.length > 0 && (
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors">
            Export CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{leads.length}</div>
              <div className="text-gray-400 text-sm">Total Leads</div>
            </div>
          </div>
        </div>
        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                ${leads.reduce((sum, l) => sum + Number(l.total_spent || 0), 0).toFixed(2)}
              </div>
              <div className="text-gray-400 text-sm">Total Spent</div>
            </div>
          </div>
        </div>
        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {leads.reduce((sum, l) => sum + (l.request_count || 0), 0)}
              </div>
              <div className="text-gray-400 text-sm">Total Requests</div>
            </div>
          </div>
        </div>
        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {leads.filter(l => l.email).length}
              </div>
              <div className="text-gray-400 text-sm">With Email</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No leads yet</p>
          <p className="text-gray-500 text-sm">
            When people request songs, their contact info will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2D2D2D]">
                  <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Phone</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Requests</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Total Spent</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[#2D2D2D] hover:bg-[#252526]">
                    <td className="p-4 text-white">{lead.name || 'Anonymous'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {lead.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      {lead.email ? (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {lead.email}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-white">{lead.request_count || 0}</td>
                    <td className="p-4 text-green-400 font-medium">
                      ${Number(lead.total_spent || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(lead.last_seen_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

