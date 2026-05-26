"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralCapture() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            // Store referral code if not already saved
            if (!localStorage.getItem('referralCode')) {
                localStorage.setItem('referralCode', ref);
            }
        }
    }, [searchParams]);

    return null;
}
