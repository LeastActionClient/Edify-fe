import React, { forwardRef } from 'react';
import schoolLogoCrest from '../assets/stanford_crest_logo.png';
import circleLogoBadge from '../assets/bonafide_circle_logo.png';

/**
 * A4 Landscape Bonafide Certificate Component
 * Exact recreation of Stanford Park Edify Nursery & Primary School reference design.
 * Dimensions: 297mm x 210mm (Standard A4 Landscape).
 * All elements have dedicated positioning containers to prevent text overlapping in all renderers (DOM, PDF, Print).
 */
const BonafideCertificateCard = forwardRef(({
  certificateData = {},
  isBlank = false,
  logoType = 'crest', // 'crest' (official school logo) | 'circle' (circular badge)
  className = ''
}, ref) => {
  const {
    serialNo = '',
    date = '',
    studentName = '',
    salutation = 'Master/Miss.',
    relation = 'son/daughter of',
    parentSalutation = 'Mr / Mrs',
    parentName = '',
    statusText = 'studying in / last studied in',
    verb = 'is/ was a',
    classGrade = '',
    academicYear = '',
    dateOfBirth = '',
    additionalText = ''
  } = certificateData;

  const activeLogo = logoType === 'circle' ? circleLogoBadge : schoolLogoCrest;

  return (
    <div
      ref={ref}
      className={`bonafide-certificate-page bg-white text-black relative select-none box-border ${className}`}
      style={{
        width: '297mm',
        height: '210mm',
        maxWidth: '297mm',
        maxHeight: '210mm',
        padding: '10mm 15mm 10mm 15mm',
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        backgroundColor: '#ffffff'
      }}
    >
      {/* 1. TOP SCHOOL HEADER (Outside / Above the black border) */}
      <div className="text-center shrink-0 mb-[2mm] pt-[1mm]">
        {/* School title in crimson red decorative serif font */}
        <div
          style={{
            color: '#c31e24',
            fontSize: '25px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontFamily: "'Cinzel', 'Copperplate', 'Times New Roman', Georgia, serif",
            letterSpacing: '1px',
            lineHeight: 1.15,
            margin: 0,
            padding: 0
          }}
        >
          STANFORD PARK EDIFY
        </div>

        {/* Nursery & Primary school in steel navy blue */}
        <div
          style={{
            color: '#214774',
            fontSize: '17.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            fontFamily: "'Times New Roman', Times, serif",
            letterSpacing: '0.5px',
            lineHeight: 1.25,
            marginTop: '2px',
            padding: 0
          }}
        >
          NURSERY & PRIMARY SCHOOL
        </div>

        {/* Address in crimson red */}
        <div
          style={{
            color: '#c31e24',
            fontSize: '9.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
            letterSpacing: '0.8px',
            lineHeight: 1.2,
            marginTop: '2px',
            padding: 0
          }}
        >
          PANNER SELVAM STREET, KALINJUR, GANDHI NAGAR, VELLORE – 632006
        </div>
      </div>

      {/* 2. MAIN CERTIFICATE BODY (Inside thin black border) */}
      <div
        className="certificate-bordered-box relative flex-1 flex flex-col justify-between border-[1.5px] border-black p-[5mm_9mm_6mm_9mm] box-border"
        style={{
          boxSizing: 'border-box'
        }}
      >
        {/* Background Watermark Crest (Faint, non-interfering) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
          style={{ opacity: 0.08 }}
        >
          <svg
            viewBox="0 0 200 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[100mm] h-[100mm] text-gray-800"
          >
            {/* Outer Shield Outline */}
            <path
              d="M100 8 L175 35 C175 130 152 195 100 234 C48 195 25 130 25 35 Z"
              stroke="currentColor"
              strokeWidth="9"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Inner Shield Contour */}
            <path
              d="M100 20 L163 44 C163 125 142 182 100 218 C58 182 37 125 37 44 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Center dividing vertical spine */}
            <path
              d="M100 30 L100 210"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="5 5"
            />
            {/* Open Book / Wings Motif */}
            <path
              d="M52 75 C75 58 96 68 100 85 C104 68 125 58 148 75 C148 118 126 154 100 172 C74 154 52 118 52 75 Z"
              fill="currentColor"
              opacity="0.35"
            />
            <circle cx="100" cy="122" r="24" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
        </div>

        {/* Certificate Inner Top: School Logo on Left + BONAFIDE CERTIFICATE Title */}
        <div className="relative z-10 flex items-center justify-between mb-[3mm] min-h-[22mm]">
          {/* Upper-Left School Logo (Maintains exact aspect ratio, no stretching/cropping) */}
          <div
            className="shrink-0 flex items-center justify-start"
            style={{ width: '56mm', height: '22mm' }}
          >
            {logoType === 'circle' ? (
              <img
                src={circleLogoBadge}
                alt="School Logo Badge"
                className="h-[21mm] w-[21mm] object-contain block drop-shadow-2xs rounded-full"
                style={{ maxHeight: '21mm', maxWidth: '21mm' }}
              />
            ) : (
              <img
                src={schoolLogoCrest}
                alt="Stanford Park Logo"
                className="h-[20mm] w-auto max-w-[54mm] object-contain block drop-shadow-2xs"
                style={{ maxHeight: '20mm', maxWidth: '54mm', objectFit: 'contain' }}
              />
            )}
          </div>

          {/* Certificate Title (Centered horizontally across certificate) */}
          <div className="flex-1 text-center -ml-[56mm]">
            <h2
              className="font-bold uppercase inline-block pb-[1.5px] border-b-[1.5px] border-black"
              style={{
                fontSize: '22px',
                fontFamily: "'Times New Roman', Times, serif",
                letterSpacing: '1.2px',
                margin: 0
              }}
            >
              BONAFIDE CERTIFICATE
            </h2>
          </div>
        </div>

        {/* Serial Number (Left) and Date (Right) Row */}
        <div
          className="relative z-10 flex items-baseline justify-between text-[15px] mb-[6mm] px-[2mm]"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Serial Number */}
          <div className="flex items-baseline">
            <span className="font-normal mr-1.5 whitespace-nowrap">Serial No.:</span>
            <span
              className="font-bold border-b border-black px-2 pb-[1px] min-w-[90px] inline-block text-center"
              style={{ minWidth: '90px' }}
            >
              {serialNo || '....................'}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-baseline">
            <span className="font-normal mr-1.5 whitespace-nowrap">Date</span>
            <span
              className="font-bold border-b border-black px-2 pb-[1px] min-w-[95px] inline-block text-center"
              style={{ minWidth: '95px' }}
            >
              {date || '........................'}
            </span>
          </div>
        </div>

        {/* Certificate Paragraph Content with Dedicated Field Containers */}
        <div
          className="relative z-10 px-[2mm] text-[16px] text-justify space-y-[4.5mm]"
          style={{
            fontFamily: "'Times New Roman', Times, Georgia, serif"
          }}
        >
          {/* Line 1: This is to certify that Master/Miss. [Student Name] ____________________ */}
          <div className="flex items-end w-full min-h-[32px]">
            <span className="shrink-0 whitespace-pre">This is to certify that {salutation} </span>
            <span
              className="font-bold uppercase px-2 pb-[1px] border-b border-black inline-block text-left shrink-0"
              style={{
                minWidth: '220px',
                letterSpacing: '0.6px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && studentName ? studentName : '\u00A0'}
            </span>
            <span className="flex-1 border-b border-black h-0 mb-[1px]" />
          </div>

          {/* Line 2: son/daughter of Mr / Mrs [Father Name] ___________________ is/ was a */}
          <div className="flex items-end w-full min-h-[32px]">
            <span className="shrink-0 whitespace-pre">{relation} {parentSalutation} </span>
            <span
              className="font-bold uppercase px-2 pb-[1px] border-b border-black inline-block text-left shrink-0"
              style={{
                minWidth: '240px',
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && parentName ? parentName : '\u00A0'}
            </span>
            <span className="flex-1 border-b border-black h-0 mb-[1px]" />
            <span className="shrink-0 whitespace-pre ml-2"> {verb}</span>
          </div>

          {/* Line 3: bonafide student of this school studying in Grade [Grade] _________ during the */}
          <div className="flex items-end w-full min-h-[32px]">
            <span className="shrink-0 whitespace-pre">bonafide student of this school {statusText} Grade </span>
            <span
              className="font-bold uppercase px-2 pb-[1px] border-b border-black inline-block text-center shrink-0"
              style={{
                minWidth: '130px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && classGrade ? classGrade : '\u00A0'}
            </span>
            <span className="flex-1 border-b border-black h-0 mb-[1px]" />
            <span className="shrink-0 whitespace-pre ml-2">during the</span>
          </div>

          {/* Line 4: year [Academic Year] _____________. His/her date of birth according to the office */}
          <div className="flex items-end w-full min-h-[32px]">
            <span className="shrink-0 whitespace-pre">year </span>
            <span
              className="font-bold px-2 pb-[1px] border-b border-black inline-block text-center shrink-0"
              style={{
                minWidth: '150px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && academicYear ? academicYear : '\u00A0'}
            </span>
            <span className="flex-1 border-b border-black h-0 mb-[1px]" />
            <span className="shrink-0 whitespace-pre ml-1">. His/her date of birth according to the office</span>
          </div>

          {/* Line 5: records is [DOB] ____________. (Optional Note) */}
          <div className="flex items-end w-full min-h-[32px]">
            <span className="shrink-0 whitespace-pre">records is </span>
            <span
              className="font-bold px-2 pb-[1px] border-b border-black inline-block text-center shrink-0"
              style={{
                minWidth: '150px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && dateOfBirth ? dateOfBirth : '\u00A0'}
            </span>
            <span className="w-[120px] border-b border-black h-0 mb-[1px]" />
            <span className="shrink-0">.</span>
            {additionalText && (
              <span className="ml-3 font-normal italic text-[14.5px] text-gray-700">
                ({additionalText})
              </span>
            )}
          </div>
        </div>

        {/* 3. SIGNATURE SECTION (Bottom) */}
        <div
          className="relative z-10 flex items-end justify-between px-[6mm] pt-[14mm] pb-[3mm]"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Facilitator (Left) */}
          <div className="text-left">
            <p className="text-[16px] font-normal tracking-wide m-0 p-0">
              Facilitator
            </p>
          </div>

          {/* Principal & (sign & seal) (Center / Right) */}
          <div className="text-center mr-[38mm]">
            <p className="text-[16px] font-normal tracking-wide m-0 p-0">
              Principal
            </p>
            <p className="text-[12.5px] font-normal italic mt-[2px] text-gray-700 m-0 p-0">
              (sign & seal)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

BonafideCertificateCard.displayName = 'BonafideCertificateCard';

export default BonafideCertificateCard;
