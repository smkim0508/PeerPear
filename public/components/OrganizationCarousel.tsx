"use client";

import Image from "next/image";

export default function OrganizationCarousel() {
    const organizations = [
        { name: "Charter", logo: "/charter.png" },
        { name: "AASA", logo: "/aasa.png" },
        { name: "PPMS", logo: "/ppms.png" },
        { name: "PSV", logo: "/psv.png" },
    ];

    // Duplicate the list to create a seamless infinite scroll effect
    const allOrganizations = [...organizations, ...organizations, ...organizations, ...organizations];

    return (
        <div className="w-full overflow-hidden bg-white py-10">
            <div className="flex w-max animate-[scroll_30s_linear_infinite] hover:[animation-play-state:paused]">
                {allOrganizations.map((org, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-center mx-8 w-32 h-32 transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110 ${org.name === "Charter" ? "scale-150 hover:scale-[1.6]" : ""
                            }`}
                    >
                        <img
                            src={org.logo}
                            alt={`${org.name} logo`}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
