import React from 'react';
import { motion } from 'framer-motion';
import type { CareerSuggestion } from './types';

interface IQCareerSuggestionsProps {
  careers: CareerSuggestion[];
}

const IQCareerSuggestions: React.FC<IQCareerSuggestionsProps> = ({ careers }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">💼</span>
        Nghề nghiệp phù hợp
      </h3>
      
      <div className="space-y-4">
        {careers.map((career, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{career.icon}</div>
              <div>
                <h4 className="font-semibold text-gray-900">{career.name}</h4>
                <p className="text-sm text-gray-600">Lương: {career.salary}/tháng</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">{career.match}%</div>
              <div className="text-xs text-gray-500">Phù hợp</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IQCareerSuggestions; 