import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { toastSuccess, toastError, toastWarning } from '../../services/toastService';
import { Plus, Trash2 } from 'lucide-react';

export default function TimetableConfigTab({
  academicYear,
  onRefreshData
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // -------------------------------------------------------------
  // PERIODS & WORKING DAYS CONFIG
  // -------------------------------------------------------------
  const [workingDays, setWorkingDays] = useState([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]);
  const [periods, setPeriods] = useState([]);

  const fetchPeriodsConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/timetable/config', { params: { academicYear } });
      if (res.data) {
        setWorkingDays(res.data.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
        setPeriods(res.data.periods || []);
      }
    } catch (err) {
      console.error('Error fetching period config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodsConfig();
  }, [academicYear]);

  const handleToggleWorkingDay = (day) => {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) {
        toastWarning('At least one working day is required.');
        return;
      }
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handlePeriodChange = (index, field, value) => {
    setPeriods((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'type') {
        copy[index].isBreak = value === 'break' || value === 'lunch';
      }
      return copy;
    });
  };

  const handleAddPeriod = () => {
    const nextNumber = periods.length + 1;
    setPeriods((prev) => [
      ...prev,
      {
        periodNumber: nextNumber,
        name: `Period ${nextNumber}`,
        startTime: '04:00 PM',
        endTime: '04:45 PM',
        type: 'teaching',
        isBreak: false
      }
    ]);
  };

  const handleRemovePeriod = (index) => {
    setPeriods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePeriodsConfig = async () => {
    setSaving(true);
    try {
      await api.post('/timetable/config', {
        academicYear,
        classId: null,
        className: 'All',
        workingDays,
        periods
      });
      toastSuccess('Period and working days configuration saved!');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border border-gray-200 shadow-xs bg-white">
        <CardContent className="p-5 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Weekly Working Days</h3>
            <p className="text-xs text-gray-500 mb-3">
              Select which days of the week school classes operate.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
              ].map((d) => {
                const isChecked = workingDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleToggleWorkingDay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isChecked
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    {isChecked ? '✓ ' : ''}
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Period Slots & Timing</h3>
                <p className="text-xs text-gray-500">
                  Define start and end times, teaching periods, morning break, and lunch break.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddPeriod}>
                <Plus size={14} className="mr-1" />
                Add Period
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-left w-14">#</th>
                    <th className="py-2.5 px-3 text-left">Period Name</th>
                    <th className="py-2.5 px-3 text-left w-28">Start Time</th>
                    <th className="py-2.5 px-3 text-left w-28">End Time</th>
                    <th className="py-2.5 px-3 text-left w-36">Slot Type</th>
                    <th className="py-2.5 px-3 text-center w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {periods.map((p, idx) => (
                    <tr key={idx} className={p.isBreak ? 'bg-amber-50/50' : 'bg-white'}>
                      <td className="py-2 px-3 font-bold text-gray-700">{p.periodNumber}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handlePeriodChange(idx, 'name', e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-gray-200 rounded text-xs font-semibold focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={p.startTime}
                          onChange={(e) => handlePeriodChange(idx, 'startTime', e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-gray-200 rounded text-xs focus:border-blue-500 focus:outline-none"
                          placeholder="09:00 AM"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={p.endTime}
                          onChange={(e) => handlePeriodChange(idx, 'endTime', e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-gray-200 rounded text-xs focus:border-blue-500 focus:outline-none"
                          placeholder="09:45 AM"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={p.type}
                          onChange={(e) => handlePeriodChange(idx, 'type', e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-gray-200 rounded text-xs font-medium focus:border-blue-500 focus:outline-none"
                        >
                          <option value="teaching">Teaching Period</option>
                          <option value="break">Morning Break</option>
                          <option value="lunch">Lunch Break</option>
                          <option value="assembly">Assembly / Event</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePeriod(idx)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remove Slot"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-200">
            <Button
              onClick={handleSavePeriodsConfig}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
