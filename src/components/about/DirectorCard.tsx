import { useState } from "react";
import { UserCircle2 } from "lucide-react";
import type { DirectorProfile } from "../../data/aboutData";

interface DirectorCardProps {
  director: DirectorProfile;
  delayMs?: number;
}

export function DirectorCard({ director, delayMs = 0 }: DirectorCardProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(director.imageSrc && !director.isPlaceholder && !imgError);

  return (
    <article className="transition-colors duration-300 rounded-2xl border border-[#1E293B] bg-[#0B0F17] overflow-hidden flex flex-col hover:border-[#10B981]/30">
      <div className="relative aspect-[4/3] bg-[#121824] border-b border-[#1E293B] flex flex-col items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={director.imageSrc}
            alt={director.imageAlt ?? `${director.name}, ${director.designation}`}
            className="w-full h-full object-cover object-top"
            loading="eager"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="w-16 h-16 rounded-full border border-[#334155] bg-[#0B0F17] flex items-center justify-center">
              <UserCircle2 size={36} className="text-[#475569]" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]">
              Official Portrait Reserved
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className={`text-lg font-semibold mb-1 ${
              director.isPlaceholder ? "text-[#94A3B8]" : "text-white"
            }`}
          >
            {director.name}
          </h3>
          <p className="text-xs font-mono uppercase tracking-wider text-[#10B981] mb-3">
            {director.designation}
          </p>
          <p className="text-sm text-[#94A3B8] leading-relaxed">{director.bio}</p>
        </div>

        {director.isPlaceholder && (
          <div className="mt-4 pt-3 border-t border-[#1E293B]">
            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-amber-300 border border-amber-500/25 rounded px-2.5 py-1 bg-amber-500/5">
              Placeholder — Details Pending
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
