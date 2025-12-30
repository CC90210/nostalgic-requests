"use client";

export default function Stats() {
  const stats = [
    { label: "Requests Processed", value: "$50k+" },
    { label: "Songs Played", value: "10k+" },
    { label: "Active Performers", value: "500+" },
  ];

  return (
    <section className="py-20 border-y border-white/5 bg-[#0F0F10]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
            {stats.map((s, i) => (
                <div key={i} className="pt-8 md:pt-0 px-4">
                    <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2 font-mono">
                        {s.value}
                    </div>
                    <div className="text-purple-400 font-medium uppercase tracking-widest text-sm">
                        {s.label}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
