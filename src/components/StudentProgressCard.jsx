import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import schoolLogo from '../assets/progress_card_logo.png';

const THEME_BLUE = '#00599c';

const SCHEME_OF_STUDIES = [
  { grade: 'A+', label: 'OUTSTANDING' },
  { grade: 'A', label: 'EXCELLENT' },
  { grade: 'B+', label: 'VERY GOOD' },
  { grade: 'B', label: 'GOOD' },
  { grade: 'C', label: 'SCOPE FOR IMPROVEMENT' },
  { grade: 'D', label: 'Need to improve' }
];

export const StudentProgressCard = React.forwardRef(({ student, printMode = false }, ref) => {
  if (!student) return null;

  const photo = student.passport_photo || student.photoUrl || '';
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [photo]);

  const studentName = (student.studentName || 'STUDENT NAME').toUpperCase();
  const currentClass = student.currentClass || '-';
  const section = student.section || 'A';
  const admissionNo = student.admissionNumber || '-';
  const aadId = student.aadId || student.aadhaarNumber || '-';
  const fatherName = (student.fatherName || '').toUpperCase();
  const motherName = (student.motherName || '').toUpperCase();
  const mobileNo = student.mobileNo || student.fatherPhone || student.motherPhone || student.whatsappNumber || '-';
  const address = String(student.address || '-').replace(/,(?!\s)/g, ', ');
  const academicYear = student.academicYear || '2025 - 2026';
  const term = student.term || 'TERM - II';

  const formatDob = (dob) => {
    if (!dob) return '-';
    try {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {
      // ignore invalid date
    }
    return String(dob);
  };

  const dobDisplay = formatDob(student.dob || student.dateOfBirth);

  const attendance = student.attendance || { totalWorkingDays: 0, studentAttendance: 0 };
  const healthStatus = student.healthStatus || { bloodGroup: '', height: '', weight: '', dentalHygiene: '' };
  const scholastic = Array.isArray(student.scholastic) ? student.scholastic : [];
  const coScholastic = Array.isArray(student.coScholastic) ? student.coScholastic : [];
  const selfAwareness = student.selfAwareness || {
    goals: '',
    strengths: '',
    interestsHobbies: '',
    responsibilitiesAchievements: ''
  };
  const teacherRemarks = student.teacherRemarks || '';

  const hasAnyNumericMark = scholastic.some(
    (row) => row.mark !== '' && row.mark !== null && row.mark !== undefined && !isNaN(parseFloat(row.mark))
  );

  const totalMarksDisplay =
    student.totalMarks !== undefined && student.totalMarks !== '' && student.totalMarks !== null
      ? student.totalMarks
      : hasAnyNumericMark
        ? scholastic.reduce((acc, row) => acc + (parseFloat(row.mark) || 0), 0)
        : '-';

  const overallGradeDisplay = student.overallGrade || '-';

  const borderGray = '1px solid #cbd5e1';
  const borderBlue = `1px solid ${THEME_BLUE}`;

  return (
    <div
      ref={ref}
      className={`progress-card-container select-none ${printMode ? '' : 'shadow-2xl'}`}
      style={{
        width: '794px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#111827',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      {/* ================= PAGE 1 ================= */}
      <div
        className="progress-card-page progress-card-page-1"
        style={{
          padding: '20px 24px 18px 24px',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page'
        }}
      >
        {/* Top School Header Banner */}
        <div
          style={{
            border: `1.5px solid ${THEME_BLUE}`,
            padding: '3px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'stretch',
            gap: '3px',
            minHeight: '96px',
            boxSizing: 'border-box'
          }}
        >
          {/* School Logo Left */}
          <div
            style={{
              width: '210px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
          >
            <img
              src={schoolLogo}
              alt="Stanford Park Logo"
              style={{ maxHeight: '82px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* School Name & Address Right */}
          <div
            style={{
              flex: 1,
              backgroundColor: THEME_BLUE,
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '10px 14px',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                lineHeight: 1.2
              }}
            >
              STANFORD PARK EDIFY N &amp; P SCHOOL
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px', lineHeight: 1.3 }}>
              1st West Cross Road, Gandhi Nagar(West), Near BTM Mahal, &ndash; 632006.
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 600, marginTop: '3px', lineHeight: 1.3 }}>
              Mobile : 8124713111, Email : stanfordparkvellore@gmail.com .
            </div>
          </div>
        </div>

        {/* Academic Year & Term Heading Strip */}
        <div
          style={{
            marginTop: '12px',
            backgroundColor: THEME_BLUE,
            color: '#ffffff',
            textAlign: 'center',
            padding: '6px 10px',
            fontSize: '12.5px',
            fontWeight: 700,
            letterSpacing: '0.3px'
          }}
        >
          Report Card : {academicYear} {term}
        </div>

        {/* Student Information Table */}
        <div
          style={{
            marginTop: '10px',
            border: borderGray,
            display: 'flex',
            alignItems: 'stretch',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Student Photo */}
          <div
            style={{
              width: '112px',
              borderRight: borderGray,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              backgroundColor: '#ffffff',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
          >
            {photo && !photoFailed ? (
              <img
                src={getImageUrl(photo)}
                alt={studentName}
                onError={() => setPhotoFailed(true)}
                style={{
                  width: '92px',
                  height: '112px',
                  objectFit: 'cover',
                  border: borderGray,
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  width: '92px',
                  height: '112px',
                  border: '1px dashed #cbd5e1',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8'
                }}
              >
                <User size={30} />
                <span style={{ fontSize: '9.5px', fontWeight: 600, marginTop: '4px', textAlign: 'center' }}>
                  Student Image
                </span>
              </div>
            )}
          </div>

          {/* Student Details 4-Column Table */}
          <table
            style={{
              flex: 1,
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              tableLayout: 'fixed'
            }}
          >
            <tbody>
              <tr>
                <td style={{ width: '19%', padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  Student Name
                </td>
                <td style={{ width: '31%', padding: '5px 8px', fontWeight: 700, color: '#0f172a', borderRight: borderGray, borderBottom: borderGray, textTransform: 'uppercase', wordBreak: 'break-word' }}>
                  {studentName}
                </td>
                <td style={{ width: '19%', padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  Father Name
                </td>
                <td style={{ width: '31%', padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderBottom: borderGray, textTransform: 'uppercase', wordBreak: 'break-word' }}>
                  {fatherName || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  Class
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderRight: borderGray, borderBottom: borderGray }}>
                  {currentClass}
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  Mother Name
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderBottom: borderGray, textTransform: 'uppercase', wordBreak: 'break-word' }}>
                  {motherName || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  Section
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderRight: borderGray, borderBottom: borderGray }}>
                  {section}
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  Mobile No
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderBottom: borderGray }}>
                  {mobileNo || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  Admission No
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderRight: borderGray, borderBottom: borderGray }}>
                  {admissionNo}
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, borderBottom: borderGray, backgroundColor: '#f8fafc' }}>
                  AAD ID
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderBottom: borderGray }}>
                  {aadId}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, backgroundColor: '#f8fafc' }}>
                  DOB
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderRight: borderGray }}>
                  {dobDisplay}
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: '#334155', borderRight: borderGray, backgroundColor: '#f8fafc' }}>
                  Address
                </td>
                <td style={{ padding: '5px 8px', fontWeight: 500, color: '#1e293b', fontSize: '10px', lineHeight: 1.25, textTransform: 'uppercase', wordBreak: 'break-word' }}>
                  {address || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Attendance Section */}
        <table
          style={{
            marginTop: '6px',
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            border: borderBlue,
            tableLayout: 'fixed'
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: '24%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  borderRight: '1px solid rgba(255,255,255,0.55)',
                  borderBottom: '1px solid rgba(255,255,255,0.55)'
                }}
              >
                Attendance
              </th>
              <th
                style={{
                  width: '38%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  borderRight: '1px solid rgba(255,255,255,0.55)',
                  borderBottom: borderBlue
                }}
              >
                Total Working Days
              </th>
              <th
                style={{
                  width: '38%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  borderBottom: borderBlue
                }}
              >
                Total Attendance of the Student
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  fontWeight: 700,
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRight: '1px solid rgba(255,255,255,0.55)'
                }}
              >
                {term}
              </td>
              <td
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 600,
                  color: '#1e293b',
                  borderRight: borderGray
                }}
              >
                {attendance.totalWorkingDays ?? '-'}
              </td>
              <td
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                {attendance.studentAttendance ?? '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Health Status Section */}
        <table
          style={{
            marginTop: '6px',
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            border: borderBlue,
            tableLayout: 'fixed'
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: '24%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  borderRight: '1px solid rgba(255,255,255,0.55)',
                  borderBottom: '1px solid rgba(255,255,255,0.55)'
                }}
              >
                Health Status
              </th>
              <th
                style={{
                  width: '19%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  borderRight: '1px solid rgba(255,255,255,0.55)'
                }}
              >
                Blood Group
              </th>
              <th
                style={{
                  width: '16%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  borderRight: '1px solid rgba(255,255,255,0.55)'
                }}
              >
                Height
              </th>
              <th
                style={{
                  width: '16%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  borderRight: '1px solid rgba(255,255,255,0.55)'
                }}
              >
                Weight
              </th>
              <th
                style={{
                  width: '25%',
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700
                }}
              >
                Dental Hygiene
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  fontWeight: 700,
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRight: '1px solid rgba(255,255,255,0.55)'
                }}
              >
                {term}
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1e293b', borderRight: borderGray, textAlign: 'center' }}>
                {healthStatus.bloodGroup || ''}
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1e293b', borderRight: borderGray, textAlign: 'center' }}>
                {healthStatus.height || ''}
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1e293b', borderRight: borderGray, textAlign: 'center' }}>
                {healthStatus.weight || ''}
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1e293b', textAlign: 'center' }}>
                {healthStatus.dentalHygiene || ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Scholastic Section */}
        <table
          style={{
            marginTop: '6px',
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11.5px',
            border: borderGray,
            tableLayout: 'fixed'
          }}
        >
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '33%' }} />
          </colgroup>
          <thead>
            <tr>
              <th
                colSpan={3}
                style={{
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: borderBlue
                }}
              >
                Scholastic
              </th>
            </tr>
            <tr style={{ backgroundColor: '#ffffff' }}>
              <th
                style={{
                  width: '34%',
                  padding: '6px 10px',
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center',
                  borderRight: borderGray,
                  borderBottom: borderGray
                }}
              >
                Subject
              </th>
              <th
                style={{
                  width: '33%',
                  padding: '6px 10px',
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center',
                  borderRight: borderGray,
                  borderBottom: borderGray
                }}
              >
                {term}
              </th>
              <th
                style={{
                  width: '33%',
                  padding: '6px 10px',
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center',
                  borderBottom: borderGray
                }}
              >
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {scholastic.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: '14px 10px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontStyle: 'italic',
                    borderBottom: borderGray
                  }}
                >
                  No scholastic subjects configured for Class {currentClass} ({academicYear}).
                </td>
              </tr>
            ) : (
              scholastic.map((item, idx) => {
                const hasMark = item.mark !== '' && item.mark !== null && item.mark !== undefined;
                return (
                  <tr key={item.subjectId || `${item.subject}-${idx}`} style={{ backgroundColor: '#ffffff' }}>
                    <td
                      style={{
                        padding: '6px 10px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#0f172a',
                        borderRight: borderGray,
                        borderBottom: borderGray
                      }}
                    >
                      {item.subject}
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        textAlign: 'center',
                        fontWeight: 500,
                        color: '#1e293b',
                        borderRight: borderGray,
                        borderBottom: borderGray
                      }}
                    >
                      {hasMark ? item.mark : '-'}
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#0f172a',
                        borderBottom: borderGray
                      }}
                    >
                      {item.grade || '-'}
                    </td>
                  </tr>
                );
              })
            )}
            <tr style={{ backgroundColor: '#ffffff' }}>
              <td
                style={{
                  padding: '6px 10px',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#0f172a',
                  borderRight: borderGray
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: '6px 10px',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#0f172a',
                  borderRight: borderGray
                }}
              >
                {totalMarksDisplay}
              </td>
              <td
                style={{
                  padding: '6px 10px',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              >
                {overallGradeDisplay}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Screen-only Page Separator */}
      <div className="progress-card-divider border-t-4 border-gray-800 my-2 print:hidden" />

      {/* ================= PAGE 2 ================= */}
      <div
        className="progress-card-page progress-card-page-2"
        style={{
          padding: '22px 24px 20px 24px',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        {/* Co - Scholastic Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11.5px',
            border: borderGray,
            tableLayout: 'fixed'
          }}
        >
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '66%' }} />
          </colgroup>
          <thead>
            <tr>
              <th
                colSpan={2}
                style={{
                  backgroundColor: THEME_BLUE,
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: borderBlue
                }}
              >
                Co - Scholastic
              </th>
            </tr>
            <tr style={{ backgroundColor: '#ffffff' }}>
              <th
                style={{
                  width: '34%',
                  padding: '6px 10px',
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center',
                  borderRight: borderGray,
                  borderBottom: borderGray
                }}
              >
                Subject
              </th>
              <th
                style={{
                  width: '66%',
                  padding: '6px 10px',
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center',
                  borderBottom: borderGray
                }}
              >
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {coScholastic.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{
                    padding: '12px 10px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontStyle: 'italic'
                  }}
                >
                  No co-scholastic subjects configured for Class {currentClass} ({academicYear}).
                </td>
              </tr>
            ) : (
              coScholastic.map((item, idx) => (
                <tr key={item.subjectId || `${item.subject}-${idx}`} style={{ backgroundColor: '#ffffff' }}>
                  <td
                    style={{
                      padding: '6px 10px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#0f172a',
                      textTransform: 'uppercase',
                      borderRight: borderGray,
                      borderBottom: idx === coScholastic.length - 1 ? 'none' : borderGray
                    }}
                  >
                    {item.subject}
                  </td>
                  <td
                    style={{
                      padding: '6px 10px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#0f172a',
                      borderBottom: idx === coScholastic.length - 1 ? 'none' : borderGray
                    }}
                  >
                    {item.grade || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Self Awareness & Scheme of Studies Side by Side */}
        <div
          style={{
            marginTop: '14px',
            border: borderGray,
            display: 'flex',
            alignItems: 'stretch',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Left: SELF AWARENESS */}
          <div
            style={{
              width: '61%',
              borderRight: borderBlue,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                backgroundColor: THEME_BLUE,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '11.5px',
                textAlign: 'center',
                padding: '6px 10px',
                textTransform: 'uppercase',
                borderRight: '1px solid rgba(255,255,255,0.55)'
              }}
            >
              SELF AWARENESS
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: '11px', color: '#1e293b' }}>
              <div style={{ padding: '7px 10px', borderBottom: borderGray, minHeight: '28px', boxSizing: 'border-box' }}>
                <span style={{ fontWeight: 600 }}>My Goals:</span>{' '}
                <span style={{ fontWeight: 400 }}>{selfAwareness.goals || ''}</span>
              </div>
              <div style={{ padding: '7px 10px', borderBottom: borderGray, minHeight: '28px', boxSizing: 'border-box' }}>
                <span style={{ fontWeight: 600 }}>My strengths:</span>{' '}
                <span style={{ fontWeight: 400 }}>{selfAwareness.strengths || ''}</span>
              </div>
              <div style={{ padding: '7px 10px', borderBottom: borderGray, minHeight: '28px', boxSizing: 'border-box' }}>
                <span style={{ fontWeight: 600 }}>My Interests and hobbies:</span>{' '}
                <span style={{ fontWeight: 400 }}>{selfAwareness.interestsHobbies || ''}</span>
              </div>
              <div style={{ padding: '7px 10px', flex: 1, minHeight: '64px', boxSizing: 'border-box' }}>
                <span style={{ fontWeight: 600 }}>Responsibilities Discharged / Exceptional Achievements :</span>{' '}
                <span style={{ fontWeight: 400 }}>{selfAwareness.responsibilitiesAchievements || ''}</span>
              </div>
            </div>
          </div>

          {/* Right: SCHEME OF STUDIES */}
          <div
            style={{
              width: '39%',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                backgroundColor: THEME_BLUE,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '11.5px',
                textAlign: 'center',
                padding: '6px 10px',
                textTransform: 'uppercase'
              }}
            >
              SCHEME OF STUDIES
            </div>
            <table
              style={{
                width: '100%',
                flex: 1,
                borderCollapse: 'collapse',
                fontSize: '11px'
              }}
            >
              <tbody>
                {SCHEME_OF_STUDIES.map((row, idx) => (
                  <tr key={row.grade}>
                    <td
                      style={{
                        width: '36px',
                        backgroundColor: THEME_BLUE,
                        color: '#ffffff',
                        fontWeight: 700,
                        textAlign: 'center',
                        padding: '5px 4px',
                        borderBottom: idx === SCHEME_OF_STUDIES.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.55)',
                        borderTop: idx === 0 ? '1px solid rgba(255,255,255,0.55)' : 'none'
                      }}
                    >
                      {row.grade}
                    </td>
                    <td
                      style={{
                        padding: '5px 10px',
                        fontWeight: 600,
                        color: '#1e293b',
                        borderBottom: idx === SCHEME_OF_STUDIES.length - 1 ? 'none' : borderGray
                      }}
                    >
                      {row.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teacher Assessment / Remarks */}
        <div
          style={{
            marginTop: '12px',
            border: borderGray,
            fontSize: '11px',
            backgroundColor: '#ffffff'
          }}
        >
          <div
            style={{
              backgroundColor: THEME_BLUE,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11.5px',
              padding: '5px 10px',
              textAlign: 'left'
            }}
          >
            Student / Teacher Assessment Details
          </div>
          <div style={{ padding: '7px 10px', minHeight: '34px', color: '#1e293b', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600 }}>Class Teacher Remarks: </span>
            <span>{teacherRemarks || '-'}</span>
          </div>
        </div>

        {/* Signature Section */}
        <div
          style={{
            marginTop: '14px',
            border: borderGray,
            fontSize: '11.5px',
            backgroundColor: '#ffffff'
          }}
        >
          <div
            style={{
              backgroundColor: THEME_BLUE,
              color: '#ffffff',
              fontWeight: 700,
              textAlign: 'center',
              padding: '6px 10px',
              fontSize: '12px'
            }}
          >
            Signature
          </div>
          <div style={{ height: '64px', backgroundColor: '#ffffff' }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderTop: borderGray,
              textAlign: 'center',
              fontWeight: 700,
              color: '#0f172a'
            }}
          >
            <div style={{ padding: '7px 8px', borderRight: borderGray }}>Class Teacher</div>
            <div style={{ padding: '7px 8px', borderRight: borderGray }}>Principal</div>
            <div style={{ padding: '7px 8px' }}>Parent</div>
          </div>
        </div>
      </div>
    </div>
  );
});

StudentProgressCard.displayName = 'StudentProgressCard';

export default StudentProgressCard;
