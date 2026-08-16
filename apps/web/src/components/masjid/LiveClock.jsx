import React, { useEffect, useState } from 'react';
import { jakartaParts } from '@/lib/masjid';

export function useJakartaClock() {
    const [now, setNow] = useState(() => jakartaParts());

    useEffect(() => {
        const id = setInterval(() => setNow(jakartaParts()), 1000);
        return () => clearInterval(id);
    }, []);

    return now;
}

const LiveClock = ({ now, className = '', style }) => (
    <div className={`font-num leading-none tracking-tight ${className}`} style={style}>
        <span>{now.hour}</span>
        <span className="text-[var(--m-primary)] opacity-70">:</span>
        <span>{now.minute}</span>
        <span className="ml-2 align-top text-[0.4em] text-[var(--m-primary)]">{now.second}</span>
    </div>
);

export default LiveClock;
