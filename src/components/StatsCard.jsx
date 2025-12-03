cat > src/components/StatsCard.jsx << 'EOF'
import React from 'react';
import { TrendingUp } from 'lucide-react';

function StatsCard({ label, value, change, icon: Icon, gradient }) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 rounded-3xl blur opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className={`bg-gradient-to-r ${gradient} p-3 rounded-2xl shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-green-600">
            <TrendingUp className="w-3 h-3" />
            {change}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {value}
        </p>
      </div>
    </div>
  );
}

export default StatsCard;
