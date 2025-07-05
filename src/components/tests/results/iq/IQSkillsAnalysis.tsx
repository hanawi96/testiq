import React from 'react';
import { motion } from 'framer-motion';
import type { SkillData } from './types';

interface IQSkillsAnalysisProps {
  skills: SkillData[];
}

const IQSkillsAnalysis: React.FC<IQSkillsAnalysisProps> = ({ skills }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 mb-6 flex items-center">
        <span className="mr-2">🎯</span>
        Phân tích kỹ năng chi tiết
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {skills.map((skill, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
          >
            <div className={`w-12 h-12 bg-${skill.color}-100 dark:bg-${skill.color}-900/30 rounded-full flex items-center justify-center text-xl mb-3`}>
              {skill.icon}
            </div>
            <div className="text-center w-full">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-sm">{skill.name}</h4>
                <span className={`text-sm font-bold text-${skill.color}-600 dark:text-${skill.color}-400`}>{skill.score}%</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 min-h-[2.5rem] flex items-center">{skill.description}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className={`bg-${skill.color}-500 h-2 rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.score}%` }}
                  transition={{ delay: 0.5 + index * 0.05, duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IQSkillsAnalysis; 