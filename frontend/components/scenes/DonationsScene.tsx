"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function formatDollar(value: number): string {
    return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getDisplayName(donation: any, showDonorNames: boolean): string {
    if (!showDonorNames) return "";
    if (donation.nameVisibility === "NONE") return "";
    return donation.displayName || "";
}

function findRecipientName(donation: any, participants: any, teams: any): string {
    const participantName =
        participants?.rankings?.find?.((entry: any) => String(entry.id) === String(donation.participantID))?.name
        || participants?.diff?.find?.((entry: any) => String(entry.id) === String(donation.participantID))?.name
        || "";

    if (participantName) {
        return participantName;
    }

    const teamName =
        teams?.rankings?.find?.((entry: any) => String(entry.id) === String(donation.teamID))?.name
        || teams?.diff?.find?.((entry: any) => String(entry.id) === String(donation.teamID))?.name
        || "";

    return teamName;
}

function donationHeadline(donation: any, showDonorNames: boolean, recipientName: string): string {
    const donorName = getDisplayName(donation, showDonorNames);

    if (donorName && recipientName) {
        return `${donorName} donated to ${recipientName}`;
    }

    if (recipientName) {
        return `Donation to ${recipientName}`;
    }

    if (donorName) {
        return donorName;
    }

    return "New donation";
}

function donationMessage(donation: any): string {
    return typeof donation?.message === "string" ? donation.message.trim() : "";
}

function formatDonationTime(value?: string): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export default function DonationsScene({
    donations,
    donationsReady,
    showDonorNames,
    participants,
    teams,
    frozen = false,
}: {
    donations: any[];
    donationsReady: boolean;
    showDonorNames: boolean;
    participants: any;
    teams: any;
    frozen?: boolean;
}) {
    const [currentDonation, setCurrentDonation] = useState<any>(null);
    const [animating, setAnimating] = useState(false);
    const queueRef = useRef<any[]>([]);
    const seenIdsRef = useRef<Set<string | number>>(new Set());
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const showingRef = useRef(false);
    const previousFrozenRef = useRef(frozen);
    const mostRecentDonation = useMemo(() => (donations.length > 0 ? donations[0] : null), [donations]);

    const showNext = useCallback(() => {
        if (frozen) {
            return;
        }

        if (queueRef.current.length === 0) {
            showingRef.current = false;
            return;
        }

        showingRef.current = true;
        const next = queueRef.current.shift()!;
        setAnimating(false);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setCurrentDonation(next);
                setAnimating(true);
            });
        });

        timerRef.current = setTimeout(showNext, 5000);
    }, [frozen]);

    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (frozen) {
            if (timerRef.current) clearTimeout(timerRef.current);
            showingRef.current = false;
            previousFrozenRef.current = true;
            return;
        }

        if (!donationsReady) {
            return;
        }

        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            queueRef.current = [];
            donations.forEach((donation) => seenIdsRef.current.add(String(donation.donationID)));
            setAnimating(false);
            setCurrentDonation(mostRecentDonation);
            return;
        }

        if (previousFrozenRef.current) {
            previousFrozenRef.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
            queueRef.current = [];
            donations.forEach((donation) => seenIdsRef.current.add(String(donation.donationID)));
            setAnimating(false);
            setCurrentDonation(mostRecentDonation);
            return;
        }

        const newDonations = donations.filter((donation) => {
            const id = String(donation.donationID);
            if (seenIdsRef.current.has(id)) {
                return false;
            }
            seenIdsRef.current.add(id);
            return true;
        });

        if (newDonations.length === 0) {
            return;
        }

        queueRef.current.push(...newDonations.reverse());
        if (!showingRef.current) {
            showNext();
        }
    }, [donations, donationsReady, frozen, mostRecentDonation, showNext]);

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    if (!currentDonation) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center bg-[#edf5ff]">
                <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-[#0b4ea2] animate-pulse" />
                    <span className="h-3 w-3 rounded-full bg-[#f1c93a] animate-pulse [animation-delay:150ms]" />
                    <span className="h-3 w-3 rounded-full bg-[#0b4ea2] animate-pulse [animation-delay:300ms]" />
                </div>
            </div>
        );
    }

    const recipientName = findRecipientName(currentDonation, participants, teams);
    const headline = donationHeadline(currentDonation, showDonorNames, recipientName);
    const note = donationMessage(currentDonation);
    const donationTime = formatDonationTime(currentDonation.createdDateUTC ?? currentDonation.createdOn);

    return (
        <div className="relative flex h-full min-h-0 overflow-hidden bg-[#edf5ff]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.72),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(241,201,58,0.18),_transparent_28%)]" />

            <div className="relative flex h-full w-full min-h-0 p-4">
                <section className="relative flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[30px] border-4 border-[#f1c93a] bg-[#fffef8] p-5 shadow-[0_18px_36px_rgba(11,78,162,0.14)]">
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-10 bg-[radial-gradient(circle,_rgba(11,78,162,0.08)_0%,_transparent_72%)]" />
                    <div className="pointer-events-none absolute left-6 top-6 flex gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#0b4ea2]" />
                        <span className="h-3 w-3 rounded-full bg-[#f1c93a]" />
                        <span className="h-3 w-3 rounded-full bg-[#0b4ea2]" />
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={String(currentDonation.donationID ?? currentDonation.id ?? currentDonation.amount ?? "current")}
                            className="relative flex min-h-0 flex-1 flex-col items-center justify-center text-center"
                            initial={animating ? { opacity: 0, y: 24, scale: 0.98 } : { opacity: 1 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -14, scale: 0.985 }}
                            transition={{ duration: frozen ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <p className="max-w-[17ch] text-balance text-[clamp(2rem,4.8vw,3.9rem)] font-semibold leading-[1.04] text-[#0b3e86]">
                                {headline}
                            </p>
                            <p className="mt-6 font-mono text-[clamp(3.7rem,10vw,7.5rem)] font-semibold leading-[0.92] text-[#0b4ea2]">
                                {formatDollar(currentDonation.amount ?? 0)}
                            </p>
                            {note ? (
                                <p className="mt-4 max-w-[28ch] text-balance text-lg leading-relaxed text-[#5a75a8]">
                                    {note}
                                </p>
                            ) : null}
                        </motion.div>
                    </AnimatePresence>

                    {donationTime ? (
                        <div className="mt-4 flex items-center justify-center">
                            <div className="rounded-full bg-[#fff1bf] px-3 py-1 text-sm font-semibold text-[#0b4ea2]">
                                {donationTime}
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
