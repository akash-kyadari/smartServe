"use client";

// This layout is minimal because the global business layout handles the navbar/structure.
// This file mainly serves to ensure the restaurant context is valid if needed,
// or just passes children through since the parent layout handles the sidebar logic.
// However, since we want a SPECIFIC sidebar for restaurant context, we can overrides/adjust here.

// Actually, looking at the hierarchy: layout.js (root) -> business/layout.js (global nav) -> business/restros/[id]/layout.js (restaurant specific)

// The user request was to "make a layout js for /business route and include navbar and all subsequent pages... navbar should be accessible including /restros/:id"

// I created business/layout.js which handles the top navbar.
// Now I need to simplify this restaurant-specific layout to avoid double-navbars or conflicting structures.
// The business/layout.js I just wrote is checking for context and rendering a top bar.
// This specific layout was rendering a sidebar. 

// Strategy:
// 1. business/layout.js: Renders the Top Navbar (always visible).
// 2. business/restros/[id]/layout.js: Renders the Sidebar (only visible when in a restaurant).

import React from "react";

export default function RestaurantSpecificLayout({ children }) {
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Content (Scrollable) */}
            <main className="flex-1 h-full overflow-y-auto bg-secondary/10 p-4 md:p-8">
                <div className="max-w-7xl mx-auto min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
