"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import BridgeSupport from '@/app/components/BridgeSupport';

const VALID = ['1', '2', '3', '4', '5', '6'];

export default function BookCreatorStagePage() {
  const params = useParams();
  const raw = String(params.stage ?? '');
  const stage = VALID.includes(raw) ? `stage${raw}` : '';
  // The Bridge fills the whole embed, so closing it (X / Done) can't unmount to
  // nothing — it collapses to a launcher the learner can reopen in place.
  const [open, setOpen] = useState(true);

  return (
    <>
      {!open && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAEE] p-6">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-[#4B2E83] text-white font-bold shadow-lg hover:bg-[#3A2467] transition-all active:scale-95"
            aria-label="Get Support — reopen The Bridge"
          >
            <HelpCircle size={20} /> Get Support
          </button>
        </div>
      )}
      <BridgeSupport
        platform="bookcreator"
        stage={stage}
        profile={[]}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
