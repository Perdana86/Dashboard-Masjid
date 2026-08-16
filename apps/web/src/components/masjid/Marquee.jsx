import React from 'react';

const Marquee = ({ text, speed = 40 }) => {
    const items = (text || '')
        .split('|')
        .map((t) => t.trim())
        .filter(Boolean);

    if (items.length === 0) return null;

    const line = (
        <span className="flex shrink-0 items-center">
            {items.map((item, i) => (
                <span key={i} className="flex items-center">
                    <span className="px-6 text-base md:text-xl">{item}</span>
                    <span className="text-[var(--m-primary)]">&#9670;</span>
                </span>
            ))}
        </span>
    );

    return (
        <div className="relative overflow-hidden border-t border-white/10 bg-[var(--m-surface)] py-3 text-emerald-50/90">
            <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
                {line}
                {line}
            </div>
        </div>
    );
};

export default Marquee;
