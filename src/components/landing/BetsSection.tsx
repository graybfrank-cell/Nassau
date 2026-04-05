const sampleScorecard = [
  { name: "Grayson", front: 38, back: 41, total: 79, skins: 3, money: "+$45" },
  { name: "Tyler", front: 42, back: 39, total: 81, skins: 2, money: "+$15" },
  { name: "Jake", front: 44, back: 43, total: 87, skins: 1, money: "-$20" },
  { name: "Marcus", front: 40, back: 45, total: 85, skins: 0, money: "-$40" },
];

export default function BetsSection() {
  return (
    <section className="bg-[#111111] px-6 py-24 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A]">
          Scoring &amp; Bets
        </p>
        <h2 className="mt-3 font-headline text-[36px] font-medium leading-tight tracking-tight text-[#F2F0EB] sm:text-[40px]">
          Bets that settle themselves
        </h2>
        <p className="mt-3 max-w-lg text-[16px] text-white/40">
          Skins, Nassau, Match Play &mdash; the math is automatic. Payouts are
          pre-calculated. Settlements are one tap.
        </p>

        {/* Scorecard preview */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            {/* Preview badge */}
            <div className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-sm">
              <span className="text-xs font-medium text-white/70">
                Preview — Live at launch
              </span>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#F2F0EB]">
                TPC Scottsdale
              </span>
              <span className="text-sm font-semibold uppercase text-[#2D5A3D]">
                Hole 16
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-white/40">
                    Player
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-white/40">
                    Front
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-white/40">
                    Back
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-white/40">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-white/40">
                    Skins
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-white/40">
                    Money
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleScorecard.map((player, i) => (
                  <tr
                    key={player.name}
                    className="border-t border-white/5"
                  >
                    <td className="px-6 py-3 font-semibold text-[#F2F0EB]">
                      {player.name}
                    </td>
                    <td className="px-4 py-3 text-center text-white/50">
                      {player.front}
                    </td>
                    <td className="px-4 py-3 text-center text-white/50">
                      {player.back}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-semibold ${
                        i === 0 ? "text-[#2D5A3D]" : "text-[#F2F0EB]"
                      }`}
                    >
                      {player.total}
                    </td>
                    <td className="px-4 py-3 text-center text-white/50">
                      {player.skins}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        player.money.startsWith("+")
                          ? "text-emerald-400"
                          : "text-[#C4423B]"
                      }`}
                    >
                      {player.money}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-center text-[16px] text-white/40">
            Commissioner Mode is free. Forever.
          </p>
        </div>
      </div>
    </section>
  );
}
