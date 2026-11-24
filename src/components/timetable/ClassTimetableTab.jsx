import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { toastSuccess, toastError, toastWarning } from '../../services/toastService';
import { useConfirm } from '../ui/ConfirmDialog';
import {
  Wand2,
  Copy,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Calendar,
  Clock,
  User,
  BookOpen,
  Lock,
  Unlock,
  Info
} from 'lucide-react';

export default function ClassTimetableTab({
  academicYear,
  classes = [],
  subjects = [],
  teachers = [],
  onRefreshStats,
  onOpenPrint
}) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual cell allocation modal
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null); // { day, periodNumber, periodConfig, existingEntry }
  const [cellForm, setCellForm] = useState({
    subjectId: '',
    teacherId: '',
    room: '',
    isBreak: false,
    breakTitle: ''
  });
  const [eligibleTeachers, setEligibleTeachers] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [cellError, setCellError] = useState('');

  // Auto-generate modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Copy modal
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [sourceTimetables, setSourceTimetables] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');

  const confirm = useConfirm();

  // Initialize selected class
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0]._id);
      const firstClass = classes[0];
      if (firstClass.sections && firstClass.sections.length > 0) {
        setSelectedSectionId(firstClass.sections[0]._id);
      } else {
        setSelectedSectionId('');
      }
    }
  }, [classes]);

  // Handle class change
  const handleClassChange = (newClassId) => {
    setSelectedClassId(newClassId);
    const cls = classes.find((c) => c._id === newClassId);
    if (cls && cls.sections && cls.sections.length > 0) {
      setSelectedSectionId(cls.sections[0]._id);
    } else {
      setSelectedSectionId('');
    }
  };

  const currentClass = classes.find((c) => c._id === selectedClassId);
  const currentSection = currentClass?.sections?.find((s) => s._id === selectedSectionId);

  // Fetch timetable for selected class & section
  const fetchTimetable = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await api.get('/timetable/class', {
        params: {
          academicYear,
          classId: selectedClassId,
          sectionId: selectedSectionId || undefined,
          sectionName: currentSection?.name || ''
        }
      });
      setTimetableData(res.data);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      toastError(err.response?.data?.error || 'Failed to load class timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedClassId, selectedSectionId, academicYear]);

  // Load eligible teachers whenever subject changes in cell modal
  useEffect(() => {
    const fetchEligible = async () => {
      if (!cellForm.subjectId) {
        setEligibleTeachers([]);
        return;
      }
      setLoadingEligible(true);
      try {
        const res = await api.get('/timetable/eligible-teachers', {
          params: {
            subjectId: cellForm.subjectId,
            className: currentClass?.name
          }
        });
        setEligibleTeachers(res.data || []);
        // Auto-select first eligible if none selected or current selection is not eligible
        if (res.data && res.data.length > 0) {
          const alreadyValid = res.data.some((t) => t._id === cellForm.teacherId);
          if (!alreadyValid) {
            setCellForm((prev) => ({ ...prev, teacherId: res.data[0]._id }));
          }
        }
      } catch (err) {
        console.error('Error fetching eligible teachers:', err);
      } finally {
        setLoadingEligible(false);
      }
    };

    if (isCellModalOpen && !cellForm.isBreak) {
      fetchEligible();
    }
  }, [cellForm.subjectId, isCellModalOpen, cellForm.isBreak]);

  // Open cell allocation modal
  const handleOpenCellModal = (day, periodSlot, existingEntry = null) => {
    setTargetSlot({ day, periodNumber: periodSlot.periodNumber, periodConfig: periodSlot, existingEntry });
    setCellError('');

    if (existingEntry) {
      setCellForm({
        subjectId: existingEntry.subjectId?._id || existingEntry.subjectId || '',
        teacherId: existingEntry.teacherId?._id || existingEntry.teacherId || '',
        room: existingEntry.room || '',
        isBreak: existingEntry.isBreak || false,
        breakTitle: existingEntry.breakTitle || ''
      });
    } else {
      setCellForm({
        subjectId: subjects.length > 0 ? subjects[0]._id : '',
        teacherId: '',
        room: '',
        isBreak: periodSlot.isBreak || false,
        breakTitle: periodSlot.name || ''
      });
    }
    setIsCellModalOpen(true);
  };

  // Save cell entry
  const handleSaveCell = async (e) => {
    e.preventDefault();
    setCellError('');
    setActionLoading(true);

    try {
      const payload = {
        timetableId: timetableData.timetable._id,
        academicYear,
        classId: selectedClassId,
        className: currentClass?.name,
        sectionId: selectedSectionId || null,
        sectionName: currentSection?.name || '',
        day: targetSlot.day,
        periodNumber: targetSlot.periodNumber,
        startTime: targetSlot.periodConfig.startTime,
        endTime: targetSlot.periodConfig.endTime,
        isBreak: cellForm.isBreak,
        breakTitle: cellForm.breakTitle,
        subjectId: cellForm.isBreak ? null : cellForm.subjectId,
        teacherId: cellForm.isBreak ? null : cellForm.teacherId,
        room: cellForm.room,
        entryId: targetSlot.existingEntry?._id || null
      };

      await api.post('/timetable/entry', payload);
      toastSuccess('Period allocation saved successfully!');
      setIsCellModalOpen(false);
      fetchTimetable();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to save period allocation.';
      setCellError(errMsg);
      toastError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete cell entry
  const handleDeleteEntry = async (entryId) => {
    const isConfirmed = await confirm({
      title: 'Remove Period Allocation?',
      description: 'Are you sure you want to remove this assigned subject and teacher from this period?',
      confirmText: 'Remove',
      tone: 'danger'
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      await api.delete(`/timetable/entry/${entryId}`);
      toastSuccess('Period allocation removed.');
      fetchTimetable();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to remove entry.');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear Timetable
  const handleClearTimetable = async () => {
    if (!timetableData?.timetable) return;
    const isConfirmed = await confirm({
      title: 'Clear Entire Class Timetable?',
      description: `This will permanently delete all period allocations for Class ${currentClass?.name}${currentSection ? ' - ' + currentSection.name : ''}. This cannot be undone.`,
      confirmText: 'Clear All Entries',
      tone: 'danger'
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      await api.post('/timetable/clear', { timetableId: timetableData.timetable._id });
      toastSuccess('Timetable cleared successfully.');
      fetchTimetable();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to clear timetable.');
    } finally {
      setActionLoading(false);
    }
  };

  // Auto-Generate Timetable
  const handleAutoGenerate = async () => {
    setGenerateError('');
    setActionLoading(true);
    try {
      const res = await api.post('/timetable/generate', {
        academicYear,
        classId: selectedClassId,
        className: currentClass?.name,
        sectionId: selectedSectionId || null,
        sectionName: currentSection?.name || ''
      });
      toastSuccess(res.data.message || 'Timetable generated successfully!');
      setIsGenerateModalOpen(false);
      fetchTimetable();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to generate timetable.';
      setGenerateError(errMsg);
      toastError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Publish / Unpublish
  const handleTogglePublish = async () => {
    if (!timetableData?.timetable) return;
    const isPublished = timetableData.timetable.isPublished;

    const isConfirmed = await confirm({
      title: isPublished ? 'Unpublish Timetable?' : 'Publish Timetable?',
      description: isPublished
        ? 'Unpublishing will set the timetable back to Draft mode so it can be edited.'
        : 'Publishing will mark this timetable as official for students and teachers. Are you ready to publish?',
      confirmText: isPublished ? 'Unpublish' : 'Publish Now',
      tone: isPublished ? 'warning' : 'primary'
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      if (isPublished) {
        await api.post('/timetable/unpublish', { timetableId: timetableData.timetable._id });
        toastSuccess('Timetable reverted to Draft mode.');
      } else {
        await api.post('/timetable/publish', { timetableId: timetableData.timetable._id });
        toastSuccess('Timetable published successfully!');
      }
      fetchTimetable();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update publication status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open copy modal
  const handleOpenCopyModal = async () => {
    try {
      const res = await api.get('/timetable/all-classes', { params: { academicYear } });
      const available = (res.data?.timetables || []).filter(
        (t) => t._id !== timetableData?.timetable?._id && t.entries && t.entries.length > 0
      );
      setSourceTimetables(available);
      if (available.length > 0) {
        setSelectedSourceId(available[0]._id);
      }
      setIsCopyModalOpen(true);
    } catch (err) {
      toastError('Failed to fetch classes for copying.');
    }
  };

  // Execute copy
  const handleExecuteCopy = async () => {
    if (!selectedSourceId || !timetableData?.timetable) return;
    setActionLoading(true);
    try {
      await api.post('/timetable/copy', {
        sourceTimetableId: selectedSourceId,
        targetTimetableId: timetableData.timetable._id
      });
      toastSuccess('Timetable copied successfully!');
      setIsCopyModalOpen(false);
      fetchTimetable();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to copy timetable.');
    } finally {
      setActionLoading(false);
    }
  };

  // Build grid map: [day][periodNumber] -> entry
  const workingDays = timetableData?.config?.workingDays || [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  const periods = (timetableData?.config?.periods || []).slice().sort((a, b) => a.periodNumber - b.periodNumber);

  const entryMap = new Map();
  (timetableData?.entries || []).forEach((e) => {
    entryMap.set(`${e.day}::${e.periodNumber}`, e);
  });

  const isPublished = timetableData?.timetable?.isPublished;

  return (
    <div className="space-y-5">
      {/* Top Filter & Action Bar */}
      <Card className="border border-gray-200 shadow-xs bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Class & Section Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="h-9 px-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none min-w-[140px]"
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentClass?.sections && currentClass.sections.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="h-9 px-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none min-w-[100px]"
                  >
                    {currentClass.sections.map((sec) => (
                      <option key={sec._id} value={sec._id}>
                        Section {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Publication Status Badge */}
              <div className="pt-5">
                {isPublished ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Lock size={13} className="text-emerald-600" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Unlock size={13} className="text-amber-600" />
                    Draft Mode
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGenerateModalOpen(true)}
                disabled={actionLoading || isPublished}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                title="Automatically generate a clash-free timetable"
              >
                <Wand2 size={15} className="mr-1.5 text-purple-600" />
                Auto-Generate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCopyModal}
                disabled={actionLoading || isPublished}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                title="Copy schedule from another class"
              >
                <Copy size={15} className="mr-1.5 text-gray-500" />
                Copy
              </Button>

              <Button
                variant={isPublished ? 'outline' : 'default'}
                size="sm"
                onClick={handleTogglePublish}
                disabled={actionLoading}
                className={
                  isPublished
                    ? 'border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                }
              >
                {isPublished ? (
                  <>
                    <Unlock size={15} className="mr-1.5" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} className="mr-1.5" />
                    Publish
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenPrint && onOpenPrint(timetableData, 'class')}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
              >
                <Printer size={15} className="mr-1.5 text-blue-600" />
                Print / PDF
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearTimetable}
                disabled={actionLoading || isPublished || !timetableData?.entries?.length}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                title="Clear all entries"
              >
                <RotateCcw size={15} className="mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Timetable Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Spinner size="lg" text="Loading timetable grid..." />
        </div>
      ) : (
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[850px]">
              {/* Header: Days of the week */}
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700">
                  <th className="py-3 px-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 w-36 border-r border-gray-200">
                    Period / Time
                  </th>
                  {workingDays.map((day) => (
                    <th
                      key={day}
                      className="py-3 px-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows: Periods */}
              <tbody className="divide-y divide-gray-200">
                {periods.map((periodSlot) => {
                  // If it's a configured break/lunch period
                  if (periodSlot.isBreak) {
                    return (
                      <tr key={periodSlot.periodNumber} className="bg-amber-50/60 hover:bg-amber-50">
                        <td className="py-2.5 px-3 border-r border-amber-200 text-xs font-bold text-amber-900">
                          <div>{periodSlot.name}</div>
                          <div className="text-[11px] font-normal text-amber-700">
                            {periodSlot.startTime} - {periodSlot.endTime}
                          </div>
                        </td>
                        <td
                          colSpan={workingDays.length}
                          className="py-2 px-4 text-center text-xs font-bold tracking-wide uppercase text-amber-800"
                        >
                          ☕ {periodSlot.name} ({periodSlot.startTime} – {periodSlot.endTime})
                        </td>
                      </tr>
                    );
                  }

                  // Normal Teaching Period row
                  return (
                    <tr key={periodSlot.periodNumber} className="hover:bg-gray-50/50">
                      {/* Left Header Cell: Period info & timings */}
                      <td className="py-2.5 px-3 bg-gray-50 border-r border-gray-200 text-xs text-gray-700">
                        <div className="font-bold text-gray-900">{periodSlot.name}</div>
                        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-gray-400" />
                          {periodSlot.startTime} - {periodSlot.endTime}
                        </div>
                      </td>

                      {/* Day Cells */}
                      {workingDays.map((day) => {
                        const entryKey = `${day}::${periodSlot.periodNumber}`;
                        const entry = entryMap.get(entryKey);

                        if (entry) {
                          const subColor = entry.subjectId?.color || '#3B82F6';
                          return (
                            <td
                              key={day}
                              className="p-1.5 border-r border-gray-200 last:border-r-0 align-top transition-all"
                            >
                              <div
                                className="group relative rounded-lg p-2.5 shadow-2xs border transition-all hover:shadow-xs"
                                style={{
                                  backgroundColor: `${subColor}10`, // 10% opacity tint
                                  borderColor: `${subColor}40`
                                }}
                              >
                                {/* Subject Pill */}
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs truncate max-w-[120px]"
                                    style={{ backgroundColor: subColor }}
                                    title={entry.subjectName}
                                  >
                                    {entry.subjectName}
                                  </span>
                                  {entry.subjectId?.code && (
                                    <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase">
                                      {entry.subjectId.code}
                                    </span>
                                  )}
                                </div>

                                {/* Teacher Name */}
                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-800 mt-1 truncate">
                                  <User size={13} className="text-gray-500 shrink-0" />
                                  <span className="truncate">{entry.teacherName || 'Assigned'}</span>
                                </div>

                                {/* Room / Details if any */}
                                {entry.room && (
                                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                                    Room: {entry.room}
                                  </div>
                                )}

                                {/* Hover Actions (Edit / Delete) */}
                                {!isPublished && (
                                  <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1 bg-white/95 rounded-md p-0.5 shadow-xs border border-gray-200">
                                    <button
                                      onClick={() => handleOpenCellModal(day, periodSlot, entry)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Edit period"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEntry(entry._id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Remove"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Empty / Unassigned Cell
                        return (
                          <td
                            key={day}
                            className="p-1.5 border-r border-gray-200 last:border-r-0 align-top"
                          >
                            <button
                              disabled={isPublished}
                              onClick={() => handleOpenCellModal(day, periodSlot)}
                              className="w-full h-full min-h-[64px] border border-dashed border-gray-300 rounded-lg p-2 text-center text-xs text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                            >
                              <Plus size={14} className="text-gray-400" />
                              <span className="text-[11px] font-medium">Assign</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: MANUAL PERIOD ALLOCATION MODAL                       */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isCellModalOpen}
        onClose={() => setIsCellModalOpen(false)}
        title={targetSlot?.existingEntry ? 'Edit Period Allocation' : 'Assign Period'}
        className="max-w-md"
      >
        <form onSubmit={handleSaveCell} className="space-y-4">
          {/* Header preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm block">
                {targetSlot?.day} – {targetSlot?.periodConfig?.name}
              </span>
              <span className="text-blue-700">
                {targetSlot?.periodConfig?.startTime} to {targetSlot?.periodConfig?.endTime}
              </span>
            </div>
            <div className="text-right font-medium text-blue-800">
              Class {currentClass?.name} {currentSection ? `(Sec ${currentSection.name})` : ''}
            </div>
          </div>

          {/* Validation Error Alert */}
          {cellError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Allocation Conflict / Error</p>
                <p className="mt-0.5 whitespace-pre-line">{cellError}</p>
              </div>
            </div>
          )}

          {/* Type Toggle: Teaching Period vs Custom Break */}
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="slotType"
                checked={!cellForm.isBreak}
                onChange={() => setCellForm((prev) => ({ ...prev, isBreak: false }))}
                className="text-blue-600 focus:ring-blue-500"
              />
              Teaching Subject
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="slotType"
                checked={cellForm.isBreak}
                onChange={() => setCellForm((prev) => ({ ...prev, isBreak: true, breakTitle: 'Special Break' }))}
                className="text-blue-600 focus:ring-blue-500"
              />
              Break / Event Slot
            </label>
          </div>

          {!cellForm.isBreak ? (
            <>
              {/* Subject Selection */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Select Subject *</Label>
                <select
                  required
                  value={cellForm.subjectId}
                  onChange={(e) => setCellForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full mt-1 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.code}) - {sub.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    Assign Teacher *
                    {eligibleTeachers.length > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {eligibleTeachers.length} assigned to {subjects.find(s => s._id === cellForm.subjectId)?.name || 'this subject'}
                      </span>
                    )}
                  </Label>
                  {loadingEligible && <span className="text-[11px] text-blue-600 font-medium">Checking assigned teachers...</span>}
                </div>
                <select
                  required
                  value={cellForm.teacherId}
                  onChange={(e) => setCellForm((prev) => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full mt-1 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Teacher --</option>
                  {eligibleTeachers.length > 0 ? (
                    <>
                      <optgroup label={`Faculty Assigned to ${subjects.find(s => s._id === cellForm.subjectId)?.name || 'this Subject'}`}>
                        {eligibleTeachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            ✓ {t.name} ({t.teacherId || t.designation || 'Faculty'})
                          </option>
                        ))}
                      </optgroup>
                      {teachers.filter((t) => !eligibleTeachers.some((et) => et._id === t._id)).length > 0 && (
                        <optgroup label="Other Faculty">
                          {teachers
                            .filter((t) => !eligibleTeachers.some((et) => et._id === t._id))
                            .map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.name} ({t.teacherId || t.designation || 'Faculty'})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.teacherId || t.designation || 'Faculty'})
                      </option>
                    ))
                  )}
                </select>
                {eligibleTeachers.length === 0 && cellForm.subjectId && !loadingEligible && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                    <Info size={12} />
                    No faculty specifically assigned to this subject. You can assign subjects in the "Teacher-Wise Schedule" tab, or choose any faculty above.
                  </p>
                )}
              </div>

              {/* Room (Optional) */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Room / Lab (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g. Room 102, Science Lab"
                  value={cellForm.room}
                  onChange={(e) => setCellForm((prev) => ({ ...prev, room: e.target.value }))}
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </>
          ) : (
            <div>
              <Label className="text-xs font-bold text-gray-700">Break Title *</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Morning Assembly, Special Break"
                value={cellForm.breakTitle}
                onChange={(e) => setCellForm((prev) => ({ ...prev, breakTitle: e.target.value }))}
                className="mt-1 h-9 text-sm"
              />
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCellModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={actionLoading || (!cellForm.isBreak && (!cellForm.subjectId || !cellForm.teacherId))}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {actionLoading ? 'Validating & Saving...' : 'Save Period'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: AUTO-GENERATE CONFIRMATION & EXPLANATION MODAL       */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Smart Timetable Generator"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 leading-relaxed">
            <p className="font-bold text-sm mb-1 flex items-center gap-1.5 text-purple-950">
              <Wand2 size={16} className="text-purple-600" />
              Automated Constraint Solver
            </p>
            The generator will:
            <ul className="list-disc ml-5 mt-1 space-y-0.5 text-purple-800">
              <li>Evenly distribute required weekly subjects across working days</li>
              <li>Guarantee <strong>zero teacher clashes</strong> across all classes in the school</li>
              <li>Respect teacher availability and daily workload maximums</li>
              <li>Schedule core subjects during morning periods</li>
              <li>Avoid excessive consecutive periods for the same teacher</li>
            </ul>
          </div>

          {generateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Generation Failed</p>
                <p className="mt-0.5 whitespace-pre-line">{generateError}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Target: <strong>Class {currentClass?.name}</strong>{' '}
            {currentSection ? `(Section ${currentSection.name})` : ''} | Academic Year:{' '}
            <strong>{academicYear}</strong>
          </p>

          <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAutoGenerate}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {actionLoading ? 'Solving Schedule...' : 'Generate Clash-Free Timetable'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: COPY TIMETABLE MODAL                                 */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Timetable From Another Class"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Select a source class timetable to copy into{' '}
            <strong>
              Class {currentClass?.name} {currentSection ? `(Section ${currentSection.name})` : ''}
            </strong>
            . All periods will be copied, and teacher conflicts will be checked.
          </p>

          {sourceTimetables.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 text-center">
              No other populated timetables found in this academic year to copy from.
            </div>
          ) : (
            <div>
              <Label className="text-xs font-bold text-gray-700">Source Timetable *</Label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full mt-1 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
              >
                {sourceTimetables.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.className} {st.sectionName ? `(Sec ${st.sectionName})` : ''} ({st.entries.length} entries)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
            <Button variant="outline" size="sm" onClick={() => setIsCopyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteCopy}
              disabled={actionLoading || !selectedSourceId || sourceTimetables.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {actionLoading ? 'Copying...' : 'Copy Schedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
