import React, { forwardRef } from 'react';
import schoolLogoCrest from '../assets/stanford_crest_logo.png';
import circleLogoBadge from '../assets/bonafide_circle_logo.png';

/**
 * A4 Landscape Bonafide Certificate Component
 * Exact recreation of Stanford Park Edify Nursery & Primary School reference design.
 * Dimensions: 297mm x 210mm (Standard A4 Landscape).
 * All elements use dedicated inline styles to ensure 100% rendering fidelity across
 * Chrome Print Preview, Save as PDF, jsPDF export, and live application view.
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

  return (
    <div
      ref={ref}
      className={`bonafide-certificate-page ${className}`}
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
        backgroundColor: '#ffffff',
        color: '#000000',
        position: 'relative'
      }}
    >
      {/* 1. TOP SCHOOL HEADER (Above black border) */}
      <div style={{ textAlign: 'center', flexShrink: 0, marginBottom: '2mm', paddingTop: '1mm' }}>
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
        className="certificate-bordered-box"
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1.5px solid #000000',
          padding: '5mm 9mm 6mm 9mm',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Background Watermark Crest (Centered, constrained to 90mm x 90mm, non-interfering) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
            overflow: 'hidden',
            opacity: 0.08
          }}
        >
          <svg
            viewBox="0 0 200 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="90mm"
            height="90mm"
            style={{
              width: '90mm',
              height: '90mm',
              maxWidth: '90mm',
              maxHeight: '90mm',
              display: 'block',
              color: '#1f2937'
            }}
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
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '3mm',
            minHeight: '22mm'
          }}
        >
          {/* Upper-Left School Logo (Maintains exact aspect ratio, no stretching/cropping) */}
          <div
            style={{
              width: '56mm',
              height: '22mm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              flexShrink: 0
            }}
          >
            {logoType === 'circle' ? (
              <img
                src={circleLogoBadge}
                alt="School Logo Badge"
                style={{
                  maxHeight: '21mm',
                  maxWidth: '21mm',
                  width: '21mm',
                  height: '21mm',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <img
                src={schoolLogoCrest}
                alt="Stanford Park Logo"
                style={{
                  maxHeight: '20mm',
                  maxWidth: '54mm',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            )}
          </div>

          {/* Certificate Title (Centered horizontally across certificate) */}
          <div style={{ flex: 1, textAlign: 'center', marginLeft: '-56mm' }}>
            <h2
              style={{
                display: 'inline-block',
                fontSize: '22px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontFamily: "'Times New Roman', Times, serif",
                letterSpacing: '1.2px',
                borderBottom: '1.5px solid #000000',
                paddingBottom: '1.5px',
                margin: 0
              }}
            >
              BONAFIDE CERTIFICATE
            </h2>
          </div>
        </div>

        {/* Serial Number (Left) and Date (Right) Row */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            fontSize: '15px',
            marginBottom: '5mm',
            padding: '0 2mm',
            fontFamily: "'Times New Roman', Times, serif"
          }}
        >
          {/* Serial Number */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 'normal', marginRight: '6px', whiteSpace: 'nowrap' }}>Serial No.:</span>
            <span
              style={{
                fontWeight: 'bold',
                borderBottom: '1px solid #000000',
                padding: '0 8px 1px 8px',
                minWidth: '90px',
                textAlign: 'center',
                display: 'inline-block'
              }}
            >
              {serialNo || '....................'}
            </span>
          </div>

          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 'normal', marginRight: '6px', whiteSpace: 'nowrap' }}>Date</span>
            <span
              style={{
                fontWeight: 'bold',
                borderBottom: '1px solid #000000',
                padding: '0 8px 1px 8px',
                minWidth: '95px',
                textAlign: 'center',
                display: 'inline-block'
              }}
            >
              {date || '........................'}
            </span>
          </div>
        </div>

        {/* Certificate Paragraph Content with Dedicated Field Containers */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '0 2mm',
            fontSize: '16px',
            textAlign: 'justify',
            display: 'flex',
            flexDirection: 'column',
            gap: '4.5mm',
            fontFamily: "'Times New Roman', Times, Georgia, serif"
          }}
        >
          {/* Line 1: This is to certify that Master/Miss. [Student Name] ____________________ */}
          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', minHeight: '32px' }}>
            <span style={{ whiteSpace: 'pre', flexShrink: 0 }}>This is to certify that {salutation} </span>
            <span
              style={{
                fontWeight: 'bold',
                textTransform: 'uppercase',
                padding: '0 8px 1px 8px',
                borderBottom: '1px solid #000000',
                display: 'inline-block',
                flexShrink: 0,
                minWidth: '220px',
                letterSpacing: '0.6px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && studentName ? studentName : '\u00A0'}
            </span>
            <span style={{ flex: 1, borderBottom: '1px solid #000000', height: 0, marginBottom: '1px' }} />
          </div>

          {/* Line 2: son/daughter of Mr / Mrs [Father Name] ___________________ is/ was a */}
          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', minHeight: '32px' }}>
            <span style={{ whiteSpace: 'pre', flexShrink: 0 }}>{relation} {parentSalutation} </span>
            <span
              style={{
                fontWeight: 'bold',
                textTransform: 'uppercase',
                padding: '0 8px 1px 8px',
                borderBottom: '1px solid #000000',
                display: 'inline-block',
                flexShrink: 0,
                minWidth: '240px',
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && parentName ? parentName : '\u00A0'}
            </span>
            <span style={{ flex: 1, borderBottom: '1px solid #000000', height: 0, marginBottom: '1px' }} />
            <span style={{ whiteSpace: 'pre', flexShrink: 0, marginLeft: '8px' }}> {verb}</span>
          </div>

          {/* Line 3: bonafide student of this school studying in Grade [Grade] _________ during the */}
          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', minHeight: '32px' }}>
            <span style={{ whiteSpace: 'pre', flexShrink: 0 }}>bonafide student of this school {statusText} Grade </span>
            <span
              style={{
                fontWeight: 'bold',
                textTransform: 'uppercase',
                padding: '0 8px 1px 8px',
                borderBottom: '1px solid #000000',
                display: 'inline-block',
                textAlign: 'center',
                flexShrink: 0,
                minWidth: '130px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && classGrade ? classGrade : '\u00A0'}
            </span>
            <span style={{ flex: 1, borderBottom: '1px solid #000000', height: 0, marginBottom: '1px' }} />
            <span style={{ whiteSpace: 'pre', flexShrink: 0, marginLeft: '8px' }}>during the</span>
          </div>

          {/* Line 4: year [Academic Year] _____________. His/her date of birth according to the office */}
          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', minHeight: '32px' }}>
            <span style={{ whiteSpace: 'pre', flexShrink: 0 }}>year </span>
            <span
              style={{
                fontWeight: 'bold',
                padding: '0 8px 1px 8px',
                borderBottom: '1px solid #000000',
                display: 'inline-block',
                textAlign: 'center',
                flexShrink: 0,
                minWidth: '150px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && academicYear ? academicYear : '\u00A0'}
            </span>
            <span style={{ flex: 1, borderBottom: '1px solid #000000', height: 0, marginBottom: '1px' }} />
            <span style={{ whiteSpace: 'pre', flexShrink: 0, marginLeft: '4px' }}>. His/her date of birth according to the office</span>
          </div>

          {/* Line 5: records is [DOB] ____________. (Optional Note) */}
          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', minHeight: '32px' }}>
            <span style={{ whiteSpace: 'pre', flexShrink: 0 }}>records is </span>
            <span
              style={{
                fontWeight: 'bold',
                padding: '0 8px 1px 8px',
                borderBottom: '1px solid #000000',
                display: 'inline-block',
                textAlign: 'center',
                flexShrink: 0,
                minWidth: '150px',
                whiteSpace: 'nowrap'
              }}
            >
              {!isBlank && dateOfBirth ? dateOfBirth : '\u00A0'}
            </span>
            <span style={{ width: '120px', borderBottom: '1px solid #000000', height: 0, marginBottom: '1px' }} />
            <span style={{ flexShrink: 0 }}>.</span>
            {additionalText && (
              <span style={{ marginLeft: '12px', fontStyle: 'italic', fontSize: '14.5px', color: '#374151' }}>
                ({additionalText})
              </span>
            )}
          </div>
        </div>

        {/* 3. SIGNATURE SECTION (Bottom) */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '12mm 6mm 2mm 6mm',
            fontFamily: "'Times New Roman', Times, serif"
          }}
        >
          {/* Facilitator (Left) */}
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '16px', fontWeight: 'normal', letterSpacing: '0.5px', margin: 0, padding: 0 }}>
              Facilitator
            </p>
          </div>

          {/* Principal & (sign & seal) (Center / Right) */}
          <div style={{ textAlign: 'center', marginRight: '38mm' }}>
            <p style={{ fontSize: '16px', fontWeight: 'normal', letterSpacing: '0.5px', margin: 0, padding: 0 }}>
              Principal
            </p>
            <p style={{ fontSize: '12.5px', fontStyle: 'italic', color: '#4b5563', margin: '2px 0 0 0', padding: 0 }}>
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
