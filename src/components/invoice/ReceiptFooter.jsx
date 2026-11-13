import React, { memo } from 'react';

const ReceiptFooter = memo(() => {
  return (
    <footer className="shrink-0 rounded-b-[12px] bg-[#A51F2B] px-3 py-[4px] text-center text-white">
      <div className="text-[8.5px] font-bold leading-none tracking-wide">
        1ST WEST CROSS ROAD, GANDHI NAGAR(WEST) VELLORE-632006
      </div>
    </footer>
  );
});

ReceiptFooter.displayName = 'ReceiptFooter';

export default ReceiptFooter;
