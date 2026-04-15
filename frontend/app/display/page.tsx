"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EventBoard from "../../components/display/EventBoard";
import { useDisplayRuntime } from "../../hooks/useDisplayRuntime";
import { isDisplayPasscodeVerified } from "../../lib/auth-storage";

export default function DisplayPage() {
    const router = useRouter();
    const [enabled, setEnabled] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const verified = isDisplayPasscodeVerified();
        setEnabled(verified);
        setChecked(true);

        if (!verified) {
            router.replace("/gate");
        }
    }, [router]);

    const runtime = useDisplayRuntime({ enabled });

    if (!checked) {
        return null;
    }

    return <EventBoard {...runtime} />;
}
