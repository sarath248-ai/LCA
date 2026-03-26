import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

const UncertaintyIndicator = ({ 
  value, 
  lowerBound, 
  upperBound, 
  confidence = 0.95,
  unit = 'kg',
  showBar = true,
  size = 'md',
  darkMode = false
}) => {
  const hasUncertainty = lowerBound !== undefined && upperBound !== undefined;
  
  if (!hasUncertainty) {
    return (
      <div className="flex items-center text-slate-500 dark:text-slate-400">
        <span>{value?.toLocaleString()} {unit}</span>
      </div>
    );
  }
  
  const mean = value || ((lowerBound + upperBound) / 2);
  const range = upperBound - lowerBound;
  const percentUncertainty = (range / mean) * 100;
  
  // Determine color based on uncertainty level
  let colorClass = '';
  let barColor = '';
  let textColor = '';
  
  if (percentUncertainty < 10) {
    colorClass = darkMode ? 'text-emerald-400' : 'text-emerald-600';
    barColor = darkMode ? 'bg-emerald-500' : 'bg-emerald-500';
    textColor = darkMode ? 'text-emerald-300' : 'text-emerald-700';
  } else if (percentUncertainty < 25) {
    colorClass = darkMode ? 'text-yellow-400' : 'text-yellow-600';
    barColor = darkMode ? 'bg-yellow-500' : 'bg-yellow-500';
    textColor = darkMode ? 'text-yellow-300' : 'text-yellow-700';
  } else {
    colorClass = darkMode ? 'text-red-400' : 'text-red-600';
    barColor = darkMode ? 'bg-red-500' : 'bg-red-500';
    textColor = darkMode ? 'text-red-300' : 'text-red-700';
  }
  
  const sizes = {
    sm: {
      text: 'text-sm',
      bar: 'h-1',
      icon: 'w-3 h-3'
    },
    md: {
      text: 'text-base',
      bar: 'h-2',
      icon: 'w-4 h-4'
    },
    lg: {
      text: 'text-lg',
      bar: 'h-3',
      icon: 'w-5 h-5'
    }
  };
  
  const { text: textSize, bar: barHeight, icon: iconSize } = sizes[size];
  
  return (
    <div className="space-y-2">
      {/* Value display */}
      <div className="flex items-center space-x-2">
        <span className={`font-medium ${textSize} ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          {mean?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {unit}
        </span>
        
        <div className="flex items-center space-x-1" title={`95% confidence: ${lowerBound.toFixed(1)} to ${upperBound.toFixed(1)} ${unit}`}>
          <div className={`${colorClass} flex items-center space-x-1`}>
            <AlertCircle className={iconSize} />
            <span className={`text-xs ${textColor}`}>
              ±{percentUncertainty.toFixed(1)}%
            </span>
          </div>
          
          <div className="group relative">
            <Info className={`w-3 h-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
              darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            }`}>
              <div className="text-xs font-medium mb-1">Uncertainty Analysis</div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>95% Confidence:</span>
                  <span className={darkMode ? 'text-slate-100' : 'text-slate-900'}>
                    {lowerBound.toFixed(1)} – {upperBound.toFixed(1)} {unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Range:</span>
                  <span className={darkMode ? 'text-slate-100' : 'text-slate-900'}>
                    {range.toFixed(1)} {unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Relative:</span>
                  <span className={textColor}>
                    {percentUncertainty.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Confidence:</span>
                  <span className={darkMode ? 'text-slate-100' : 'text-slate-900'}>
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Uncertainty bar */}
      {showBar && (
        <div className="relative">
          <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full ${barHeight}`}>
            <div 
              className={`${barColor} ${barHeight} rounded-full transition-all duration-300`}
              style={{ 
                width: `${Math.min(percentUncertainty * 2, 100)}%`,
                marginLeft: `${Math.max((lowerBound / (upperBound * 1.5)) * 100, 0)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{lowerBound.toFixed(0)}</span>
            <span>Uncertainty Range</span>
            <span>{upperBound.toFixed(0)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UncertaintyIndicator;