"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";

export function AuthProvider({ children }) {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return <>{children}</>;
}
