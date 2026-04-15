"use client";

const EVENT_LOGO = process.env.NEXT_PUBLIC_EVENT_LOGO_PNG;

type StandbySceneProps = {
    headline?: string;
    subtitle?: string;
    statusLabel?: string;
};

export default function StandbyScene({
    headline = "Dance Marathon",
    subtitle = "Broadcast feed ready",
    statusLabel = "STANDBY",
}: StandbySceneProps) {
    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#edf5ff]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.72),_transparent_28%),repeating-linear-gradient(135deg,rgba(11,78,162,0.06)_0,rgba(11,78,162,0.06)_18px,transparent_18px,transparent_36px)]" />
            <div className="pointer-events-none absolute left-8 right-8 top-8 flex justify-center gap-3">
                {["#f1c93a", "#ffffff", "#f1c93a", "#ffffff", "#f1c93a", "#ffffff"].map((color, index) => (
                    <span
                        key={`${color}-${index}`}
                        className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[26px] border-l-transparent border-r-transparent"
                        style={{ borderTopColor: color }}
                    />
                ))}
            </div>

            {EVENT_LOGO ? (
                <img
                    src={EVENT_LOGO}
                    alt=""
                    className="relative z-10 max-h-[42vh] w-[min(70%,28rem)] object-contain opacity-95 drop-shadow-[0_12px_30px_rgba(11,78,162,0.18)]"
                />
            ) : (
                <div className="relative z-10 flex items-center gap-5">
                    <span className="h-9 w-9 rounded-full bg-[#0b4ea2]" />
                    <span className="h-9 w-9 rounded-full bg-[#f1c93a]" />
                    <span className="h-9 w-9 rounded-full bg-[#0b4ea2]" />
                </div>
            )}
        </div>
    );
}
