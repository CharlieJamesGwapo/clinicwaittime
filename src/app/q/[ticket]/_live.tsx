"use client";

import { useEffect, useState } from "react";

type Props = {
  number: string;
  initialStatus: string;
  initialPositionAhead: number;
  initialEstimatedWaitMinutes: number;
};

export function TicketStatusLive(props: Props) {
  const [status, setStatus] = useState(props.initialStatus);
  const [position, setPosition] = useState(props.initialPositionAhead);
  const [eta, setEta] = useState(props.initialEstimatedWaitMinutes);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch(`/api/ticket/${props.number}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        setPosition(data.positionAhead);
        setEta(data.estimatedWaitMinutes);
      } catch {
        /* retry next tick */
      }
    };
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [props.number]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-2xl">
        Status: <strong>{status}</strong>
      </p>
      <p>{position} ticket(s) ahead of you</p>
      <p>Estimated wait: ~{eta} min</p>
    </div>
  );
}
