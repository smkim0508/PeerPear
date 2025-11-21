'use client';

interface OrganizationProps {
  params: { slug: string };
}
// Sample organization data
const organizations = [
  {
    id: 1,
    name: "AASA",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop&crop=center",
    description: "Leading technology and innovation community"
  },
  {
    id: 2,
    name: "POP-UP Club",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop&crop=center",
    description: "Environmental conservation and sustainability"
  },
  {
    id: 3,
    name: "Charter Club",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=100&h=100&fit=crop&crop=center",
    description: "Fostering creativity and artistic expression"
  }
];

export default function OrganizationPage({ params }: OrganizationProps) {
  const { slug } = params;
  const organizationId = parseInt(slug);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7F0] via-[#E8F4D6] to-[#D7E8C2] flex items-center justify-center p-6">
      <div className="bg-[#CCCEC1] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#ABC469] p-6">
          <h1 className="text-2xl font-bold text-black text-center">Select an Organization</h1>
          <p className="text-black text-center mt-2">Choose an organization to view their dashboard</p>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto bg-[#d7d8d1]">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center p-4 rounded-xl border bg-[#E5E6DD] hover:bg-[#ABC469]"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <img
                  src={org.image}
                  alt={`${org.name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="ml-4 flex-grow">
                <h3 className="font-semibold text-black transition-colors">
                  {org.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {org.description}
                </p>
              </div>

              <div className="ml-4 opacity-0 transition-opacity">
                <svg
                  className="w-5 h-5 text-pear-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}