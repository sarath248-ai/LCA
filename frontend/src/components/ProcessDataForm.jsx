import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

const ProcessDataForm = ({ projectId, onSubmit, onCancel, darkMode }) => {
  const [formData, setFormData] = useState({
    batch_id: `BATCH-${Date.now()}`,
    project_id: projectId,
    raw_material_type: 'Iron Ore',
    material_type: 'Steel',
    energy_source_type: 'Electricity',
    raw_material_quantity: 1000,
    recycled_material_quantity: 200,
    energy_consumption_kwh: 5000,
    water_consumption_liters: 10000,
    production_volume: 800,
    ore_grade: 0.7,
    waste_slag_quantity: 150,
    scrap_content_percentage: 20,
    recycling_rate_percentage: 30,
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const theme = {
    inputBg: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-600',
    border: darkMode ? 'border-slate-700' : 'border-slate-200',
    cardBg: darkMode ? 'bg-slate-800' : 'bg-white',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${theme.cardBg} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden`}>
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${theme.text}`}>Add Process Data</h2>
            <p className={`text-sm ${theme.textMuted}`}>Enter manufacturing process details</p>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 ${theme.textMuted} hover:${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-lg`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Batch ID */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Batch ID *
              </label>
              <input
                type="text"
                name="batch_id"
                value={formData.batch_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Raw Material Type */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Raw Material Type *
              </label>
              <select
                name="raw_material_type"
                value={formData.raw_material_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
              >
                <option value="Iron Ore">Iron Ore</option>
                <option value="Bauxite">Bauxite</option>
                <option value="Copper Ore">Copper Ore</option>
                <option value="Aluminum Ore">Aluminum Ore</option>
              </select>
            </div>

            {/* Material Type */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Material Type *
              </label>
              <select
                name="material_type"
                value={formData.material_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
              >
                <option value="Steel">Steel</option>
                <option value="Aluminium">Aluminium</option>
                <option value="Copper">Copper</option>
                <option value="Brass">Brass</option>
              </select>
            </div>

            {/* Energy Source */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Energy Source *
              </label>
              <select
                name="energy_source_type"
                value={formData.energy_source_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
              >
                <option value="Electricity">Electricity</option>
                <option value="Coal">Coal</option>
                <option value="Natural Gas">Natural Gas</option>
                <option value="Renewable">Renewable</option>
              </select>
            </div>

            {/* Raw Material Quantity */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Raw Material (kg) *
              </label>
              <input
                type="number"
                name="raw_material_quantity"
                value={formData.raw_material_quantity}
                onChange={handleChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Recycled Material */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Recycled Material (kg) *
              </label>
              <input
                type="number"
                name="recycled_material_quantity"
                value={formData.recycled_material_quantity}
                onChange={handleChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Energy Consumption */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Energy Consumption (kWh) *
              </label>
              <input
                type="number"
                name="energy_consumption_kwh"
                value={formData.energy_consumption_kwh}
                onChange={handleChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Water Consumption */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Water Consumption (L) *
              </label>
              <input
                type="number"
                name="water_consumption_liters"
                value={formData.water_consumption_liters}
                onChange={handleChange}
                step="1"
                min="0"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Production Volume */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Production Volume (kg) *
              </label>
              <input
                type="number"
                name="production_volume"
                value={formData.production_volume}
                onChange={handleChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Ore Grade */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Ore Grade (0-1) *
              </label>
              <input
                type="number"
                name="ore_grade"
                value={formData.ore_grade}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="1"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Waste Slag */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Waste Slag (kg) *
              </label>
              <input
                type="number"
                name="waste_slag_quantity"
                value={formData.waste_slag_quantity}
                onChange={handleChange}
                step="0.1"
                min="0"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Scrap Content */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Scrap Content (%) *
              </label>
              <input
                type="number"
                name="scrap_content_percentage"
                value={formData.scrap_content_percentage}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>

            {/* Recycling Rate */}
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Recycling Rate (%) *
              </label>
              <input
                type="number"
                name="recycling_rate_percentage"
                value={formData.recycling_rate_percentage}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                className={`w-full px-3 py-2 border ${theme.inputBg} ${theme.text} rounded-lg`}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessDataForm;