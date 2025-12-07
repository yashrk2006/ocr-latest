
import React, { useEffect, useState } from "react";
import { Progress } from "@ark-ui/react/progress";
import "./progress-bar.css";

export function ProgressWithLabel({
    value,
    label,
    delay = 0,
    duration = 1000,
    colorFrom = "#ef4444",
    colorTo = "#db2777",
    className = "",
    simulated = false,
}) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // If simulated, we animate slowly up to 90%
        if (simulated && value === 'auto') {
            let current = 0;
            const interval = setInterval(() => {
                current += (90 - current) * 0.05; // Decaying growth
                if (current > 89) current = 89;
                setProgress(current);
            }, 500);
            return () => clearInterval(interval);
        }
        // If value is provided directly (e.g. 0, then 100)
        else {
            const timer = setTimeout(() => {
                setProgress(value);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [value, delay, simulated]);

    return (
        <Progress.Root
            value={progress}
            className={`progress-root ${className}`}
        >
            {label && (
                <div className="progress-header">
                    <Progress.Label className="progress-label">
                        {label}
                    </Progress.Label>
                    <Progress.ValueText className="progress-label" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {Math.round(progress)}%
                    </Progress.ValueText>
                </div>
            )}

            <div className="progress-track-container">
                <Progress.Track className="progress-track">
                    <Progress.Range
                        className="progress-range"
                        style={{
                            background: `linear-gradient(to right, ${colorFrom}, ${colorTo})`,
                            transitionDuration: `${duration}ms`
                        }}
                    />
                </Progress.Track>
            </div>
        </Progress.Root>
    );
}
