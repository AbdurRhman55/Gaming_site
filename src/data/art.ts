/**
 * Original SVG artwork (inner markup, 320×180 viewBox unless noted).
 *
 * All illustrations are drawn for this site from scratch — flat, geometric
 * treatments of generic driving motifs. No screenshots, no traced or copied
 * game art. Each game gets its own composition instead of one shared image.
 */

export const ART: Record<string, string> = {
  /* ---- series: top-down lot compositions ---- */
  pf1: `
    <rect width="320" height="180" fill="transparent"/>
    <path d="M0 128h320" stroke="#1d2943" stroke-width="44"/>
    <path d="M0 128h320" stroke="#f5c518" stroke-width="2" stroke-dasharray="14 12" opacity=".45"/>
    <rect x="196" y="26" width="84" height="60" rx="5" fill="#14161b" stroke="#f5c518" stroke-width="2" stroke-dasharray="9 7" opacity=".95"/>
    <rect x="106" y="30" width="72" height="34" rx="7" fill="#46609a"/>
    <rect x="112" y="38" width="30" height="18" rx="3" fill="#14161b" opacity=".65"/>
    <rect x="286" y="30" width="26" height="34" rx="7" fill="#8a5b7d"/>
    <g transform="translate(64 132) rotate(-58)">
      <rect x="-30" y="-15" width="60" height="30" rx="8" fill="#f5c518"/>
      <rect x="-8" y="-10" width="22" height="20" rx="4" fill="#14161b"/>
      <circle cx="24" cy="-11" r="3" fill="#f4f7fb"/><circle cx="24" cy="11" r="3" fill="#f4f7fb"/>
      <circle cx="-26" cy="-11" r="3" fill="#ff6b6b"/><circle cx="-26" cy="11" r="3" fill="#ff6b6b"/>
    </g>
    <path d="M96 108c40-34 74-46 116-52" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 9" stroke-linecap="round" fill="none" opacity=".8"/>
    <path d="M206 46l10 10-10 10" stroke="#f5c518" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  pf2: `
    <rect width="320" height="180" fill="transparent"/>
    <path d="M-20 160 L340 60" stroke="#1d2943" stroke-width="54"/>
    <path d="M-20 160 L340 60" stroke="#8d9ab1" stroke-width="2" stroke-dasharray="16 14" opacity=".35"/>
    <g transform="translate(210 74) rotate(-16)">
      <rect x="-40" y="-26" width="80" height="52" rx="5" fill="#14161b" stroke="#f5c518" stroke-width="2" stroke-dasharray="9 7"/>
    </g>
    <rect x="96" y="34" width="66" height="32" rx="7" fill="#66748f" transform="rotate(-16 129 50)"/>
    <rect x="240" y="112" width="66" height="32" rx="7" fill="#46609a" transform="rotate(-16 273 128)"/>
    <g transform="translate(76 138) rotate(-16)">
      <rect x="-30" y="-15" width="60" height="30" rx="8" fill="#f5c518"/>
      <rect x="-8" y="-10" width="22" height="20" rx="4" fill="#14161b"/>
      <circle cx="24" cy="-11" r="3" fill="#f4f7fb"/><circle cx="24" cy="11" r="3" fill="#f4f7fb"/>
    </g>
    <path d="M108 122c50-18 78-30 100-38" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 9" stroke-linecap="round" fill="none" opacity=".85"/>
    <text x="18" y="36" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" font-weight="800" fill="#f5c518" opacity=".9">2</text>`,
  pf3: `
    <rect width="320" height="180" fill="transparent"/>
    <rect x="0" y="96" width="320" height="84" fill="#121a2b"/>
    <path d="M0 96h320" stroke="#1d2943" stroke-width="6"/>
    <g>
      <rect x="24" y="112" width="60" height="30" rx="7" fill="#46609a"/>
      <rect x="104" y="112" width="60" height="30" rx="7" fill="#8a5b7d"/>
      <rect x="250" y="112" width="60" height="30" rx="7" fill="#66748f"/>
    </g>
    <rect x="180" y="106" width="58" height="44" rx="5" fill="#0e1524" stroke="#f5c518" stroke-width="2" stroke-dasharray="9 7"/>
    <g transform="translate(150 54)">
      <rect x="-34" y="-17" width="68" height="34" rx="9" fill="#f5c518"/>
      <rect x="-8" y="-11" width="26" height="22" rx="4" fill="#14161b"/>
      <circle cx="27" cy="-12" r="3.5" fill="#f4f7fb"/><circle cx="27" cy="12" r="3.5" fill="#f4f7fb"/>
    </g>
    <path d="M126 66c34 2 44 14 50 34" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 9" stroke-linecap="round" fill="none" opacity=".85"/>
    <text x="18" y="36" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" font-weight="800" fill="#f5c518" opacity=".9">3</text>`,
  pf3d: `
    <defs>
      <linearGradient id="sky3d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0e1730"/><stop offset="1" stop-color="#0b0f18" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="320" height="180" fill="url(#sky3d)"/>
    <g fill="#131c31">
      <rect x="8" y="46" width="52" height="76"/><rect x="70" y="26" width="44" height="96"/>
      <rect x="124" y="58" width="40" height="64"/><rect x="176" y="16" width="52" height="106"/>
      <rect x="238" y="44" width="38" height="78"/><rect x="284" y="62" width="30" height="60"/>
    </g>
    <g fill="#f5c518" opacity=".55">
      <rect x="18" y="58" width="7" height="7"/><rect x="34" y="72" width="7" height="7"/>
      <rect x="80" y="40" width="7" height="7"/><rect x="96" y="58" width="7" height="7"/>
      <rect x="188" y="30" width="7" height="7"/><rect x="206" y="52" width="7" height="7"/>
      <rect x="248" y="58" width="7" height="7"/>
    </g>
    <path d="M110 122 L210 122 L268 180 L52 180 Z" fill="#10161f"/>
    <path d="M160 126 v10 M160 146 v14 M160 170 v10" stroke="#8d9ab1" stroke-width="3" stroke-dasharray="8 10" opacity=".5"/>
    <g transform="translate(160 156)">
      <rect x="-46" y="-24" width="92" height="48" rx="10" fill="#f5c518"/>
      <rect x="-34" y="-16" width="68" height="20" rx="6" fill="#14161b" opacity=".85"/>
      <circle cx="-36" cy="24" r="8" fill="#05070b"/><circle cx="36" cy="24" r="8" fill="#05070b"/>
      <rect x="-44" y="-38" width="14" height="8" rx="3" fill="#f4f7fb"/>
      <rect x="30" y="-38" width="14" height="8" rx="3" fill="#f4f7fb"/>
    </g>`,
  beach: `
    <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12405a"/><stop offset="1" stop-color="#0e2a3d"/></linearGradient></defs>
    <rect width="320" height="180" fill="#0e1524"/>
    <rect x="0" y="0" width="320" height="74" fill="url(#sea)"/>
    <circle cx="258" cy="34" r="18" fill="#ffd08b" opacity=".85"/>
    <path d="M0 74h320" stroke="#f5c518" stroke-width="2" opacity=".35"/>
    <rect x="0" y="74" width="320" height="14" fill="#1a2438"/>
    <path d="M0 88h320 L320 180 L0 180Z" fill="#14161b"/>
    <path d="M40 96l-24 84 M120 96l-8 84" stroke="#8d9ab1" stroke-width="2" stroke-dasharray="10 12" opacity=".35"/>
    <g stroke="#1d2943" stroke-width="6" fill="none"><path d="M56 92v-30"/></g>
    <g fill="#2f7d5b"><path d="M56 62c-14-12-30-10-38-2 14-2 26 2 38 10z"/><path d="M56 62c14-12 30-10 38-2-14-2-26 2-38 10z"/><path d="M56 62c-4-16 4-28 14-32-8 8-12 18-12 32z"/></g>
    <g transform="translate(120 132) rotate(-8)">
      <rect x="-34" y="-17" width="68" height="34" rx="9" fill="#ffe066"/>
      <rect x="-8" y="-11" width="26" height="22" rx="4" fill="#14161b"/>
      <circle cx="27" cy="-12" r="3.5" fill="#f4f7fb"/><circle cx="27" cy="12" r="3.5" fill="#f4f7fb"/>
    </g>
    <rect x="204" y="112" width="76" height="52" rx="5" fill="#0b0f18" stroke="#f5c518" stroke-width="2" stroke-dasharray="9 7" opacity=".9"/>`,
  bounty: `
    <rect width="320" height="180" fill="#090c14"/>
    <g fill="#111a2c"><rect x="0" y="40" width="70" height="80"/><rect x="250" y="30" width="70" height="90"/></g>
    <path d="M0 120h320" stroke="#151d2f" stroke-width="60"/>
    <path d="M20 120h280" stroke="#8d9ab1" stroke-width="2" stroke-dasharray="18 16" opacity=".3"/>
    <g transform="translate(160 84)">
      <path d="M-70 60 L0 -30 L70 60Z" fill="#ffd08b" opacity=".12"/>
    </g>
    <circle cx="160" cy="132" r="34" fill="none" stroke="#f5c518" stroke-width="2" stroke-dasharray="7 9" opacity=".9"/>
    <g transform="translate(160 132)">
      <rect x="-32" y="-16" width="64" height="32" rx="8" fill="#24314f"/>
      <rect x="-7" y="-10" width="24" height="20" rx="4" fill="#14161b"/>
      <circle cx="26" cy="-11" r="3" fill="#f4f7fb"/><circle cx="26" cy="11" r="3" fill="#f4f7fb"/>
      <circle cx="-28" cy="-11" r="3" fill="#ff6b6b"/><circle cx="-28" cy="11" r="3" fill="#ff6b6b"/>
    </g>
    <path d="M64 148c40 14 78 8 66-16" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 9" fill="none" stroke-linecap="round"/>
    <text x="132" y="42" font-family="ui-sans-serif,system-ui,sans-serif" font-size="34" font-weight="800" fill="#f5c518">◎</text>`,
  school: `
    <rect width="320" height="180" fill="transparent"/>
    <path d="M0 44h320 M0 136h320" stroke="#1d2943" stroke-width="4"/>
    <path d="M0 90h320" stroke="#8d9ab1" stroke-width="3" stroke-dasharray="22 18" opacity=".4"/>
    <g fill="#ff8b6b">
      <path d="M52 112l8-22 8 22z"/><rect x="48" y="112" width="24" height="5" rx="2"/>
      <path d="M246 66l8-22 8 22z"/><rect x="242" y="66" width="24" height="5" rx="2"/>
    </g>
    <g transform="translate(132 62)">
      <rect x="-34" y="-17" width="68" height="34" rx="9" fill="#46609a"/>
      <rect x="-8" y="-11" width="26" height="22" rx="4" fill="#14161b"/>
      <circle cx="27" cy="-12" r="3.5" fill="#f4f7fb"/><circle cx="27" cy="12" r="3.5" fill="#f4f7fb"/>
    </g>
    <rect x="196" y="104" width="66" height="46" rx="5" fill="#14161b" stroke="#f5c518" stroke-width="2" stroke-dasharray="9 7"/>
    <text x="26" y="34" font-family="ui-sans-serif,system-ui,sans-serif" font-size="20" font-weight="800" fill="#f5c518" opacity=".9">SCHOOL</text>`,
  extreme: `
    <rect width="320" height="180" fill="transparent"/>
    <rect x="0" y="0" width="320" height="180" fill="#0e1524"/>
    <rect x="96" y="16" width="16" height="148" fill="#1d2943"/>
    <rect x="224" y="16" width="16" height="148" fill="#1d2943"/>
    <g fill="#ffd08b" opacity=".7"><rect x="98" y="30" width="12" height="14"/><rect x="98" y="70" width="12" height="14"/><rect x="98" y="110" width="12" height="14"/><rect x="226" y="50" width="12" height="14"/><rect x="226" y="90" width="12" height="14"/><rect x="226" y="130" width="12" height="14"/></g>
    <rect x="120" y="24" width="88" height="132" rx="6" fill="#0a0e17" stroke="#f5c518" stroke-width="2" stroke-dasharray="10 8"/>
    <g transform="translate(164 92) rotate(-90)">
      <rect x="-32" y="-16" width="64" height="32" rx="8" fill="#f5c518"/>
      <rect x="-7" y="-10" width="24" height="20" rx="4" fill="#14161b"/>
      <circle cx="26" cy="-11" r="3" fill="#f4f7fb"/><circle cx="26" cy="11" r="3" fill="#f4f7fb"/>
    </g>
    <path d="M40 92h44 M252 92h36" stroke="#f5c518" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <path d="M76 84l10 8-10 8 M276 84l10 8-10 8" stroke="#f5c518" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  dubai: `
    <defs><linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#131c31"/><stop offset="1" stop-color="#0b0f18" stop-opacity="0"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#dsky)"/>
    <g fill="#182440">
      <path d="M36 120V64l14-26 14 26v56z"/><rect x="86" y="52" width="26" height="68"/>
      <path d="M150 120V44l16-30 16 30v76z"/><rect x="212" y="60" width="30" height="60"/>
      <path d="M266 120V70l12-20 12 20v50z"/>
    </g>
    <rect x="0" y="120" width="320" height="60" fill="#10161f"/>
    <path d="M0 138h320" stroke="#8d9ab1" stroke-width="2" stroke-dasharray="16 14" opacity=".35"/>
    <g transform="translate(150 150)">
      <rect x="-44" y="-22" width="88" height="44" rx="10" fill="#f4f7fb"/>
      <rect x="-32" y="-14" width="64" height="18" rx="6" fill="#14161b" opacity=".85"/>
      <rect x="-14" y="-30" width="28" height="9" rx="4" fill="#46609a"/>
      <rect x="-8" y="-30" width="7" height="9" rx="3" fill="#ff6b6b"/><rect x="1" y="-30" width="7" height="9" rx="3" fill="#4f9dff"/>
      <circle cx="-34" cy="22" r="8" fill="#05070b"/><circle cx="34" cy="22" r="8" fill="#05070b"/>
    </g>`,
  truck: `
    <rect width="320" height="180" fill="transparent"/>
    <path d="M0 140h320" stroke="#151d2f" stroke-width="40"/>
    <rect x="196" y="30" width="104" height="86" rx="6" fill="#14161b" stroke="#f5c518" stroke-width="2" stroke-dasharray="9 7"/>
    <g transform="translate(110 116)">
      <rect x="-70" y="-46" width="92" height="52" rx="6" fill="#dfe6f2"/>
      <rect x="-70" y="-46" width="92" height="12" rx="4" fill="#b9c4d6"/>
      <path d="M22 -36h30l16 22v18H22z" fill="#46609a"/>
      <rect x="28" y="-30" width="22" height="14" rx="3" fill="#14161b" opacity=".8"/>
      <circle cx="-50" cy="8" r="10" fill="#05070b"/><circle cx="-24" cy="8" r="10" fill="#05070b"/>
      <circle cx="52" cy="8" r="10" fill="#05070b"/>
      <circle cx="66" cy="-6" r="3.5" fill="#ffd08b"/>
    </g>
    <path d="M148 96c34-6 44-14 52-30" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 9" fill="none" stroke-linecap="round"/>`,
  puzzle: `
    <rect width="320" height="180" fill="transparent"/>
    <rect x="20" y="16" width="280" height="148" rx="10" fill="#14161b" stroke="#1d2943" stroke-width="2"/>
    <g stroke="#0b0f18" stroke-width="3">
      <rect x="34" y="30" width="86" height="34" rx="8" fill="#f5c518"/>
      <rect x="128" y="30" width="34" height="86" rx="8" fill="#46609a"/>
      <rect x="170" y="30" width="86" height="34" rx="8" fill="#8a5b7d"/>
      <rect x="34" y="72" width="86" height="34" rx="8" fill="#66748f"/>
      <rect x="34" y="114" width="34" height="34" rx="8" fill="#ffe066"/>
      <rect x="170" y="72" width="34" height="76" rx="8" fill="#ffd08b"/>
      <rect x="212" y="72" width="44" height="34" rx="8" fill="#46609a"/>
      <rect x="212" y="114" width="86" height="34" rx="8" fill="#8a5b7d"/>
      <rect x="76" y="114" width="86" height="34" rx="8" fill="#24314f"/>
    </g>
    <path d="M266 96h30" stroke="#f5c518" stroke-width="4" stroke-linecap="round"/>
    <path d="M288 88l10 8-10 8" stroke="#f5c518" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  mania: `
    <rect width="320" height="180" fill="transparent"/>
    <rect x="0" y="118" width="320" height="62" fill="#121a2b"/>
    <path d="M0 118h320" stroke="#1d2943" stroke-width="4"/>
    <g>
      <rect x="24" y="26" width="70" height="56" rx="5" fill="#0e1524" stroke="#8d9ab1" stroke-width="2" stroke-dasharray="8 7" opacity=".8"/>
      <rect x="126" y="26" width="70" height="56" rx="5" fill="#0e1524" stroke="#f5c518" stroke-width="2" stroke-dasharray="8 7"/>
      <rect x="228" y="26" width="70" height="56" rx="5" fill="#0e1524" stroke="#8d9ab1" stroke-width="2" stroke-dasharray="8 7" opacity=".8"/>
      <rect x="34" y="36" width="50" height="28" rx="7" fill="#46609a"/>
      <rect x="238" y="36" width="50" height="28" rx="7" fill="#8a5b7d"/>
    </g>
    <g transform="translate(80 148)">
      <rect x="-32" y="-16" width="64" height="32" rx="8" fill="#f5c518"/>
      <rect x="-7" y="-10" width="24" height="20" rx="4" fill="#14161b"/>
      <circle cx="26" cy="-11" r="3" fill="#f4f7fb"/><circle cx="26" cy="11" r="3" fill="#f4f7fb"/>
    </g>
    <path d="M110 140c30-2 44-24 46-52" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 9" fill="none" stroke-linecap="round"/>
    <text x="270" y="164" font-family="ui-sans-serif,system-ui,sans-serif" font-size="30" font-weight="800" fill="#f5c518" opacity=".85">P</text>`,
  classic: `
    <rect width="320" height="180" fill="transparent"/>
    <g fill="#14161b">
      <rect x="16" y="16" width="288" height="148" rx="8"/>
    </g>
    <path d="M16 96h288" stroke="#1d2943" stroke-width="3" stroke-dasharray="14 12"/>
    <rect x="196" y="112" width="80" height="40" rx="4" fill="#0a0e17" stroke="#f5c518" stroke-width="2" stroke-dasharray="8 6"/>
    <g shape-rendering="crispEdges">
      <rect x="46" y="30" width="58" height="30" fill="#46609a"/>
      <rect x="52" y="36" width="24" height="18" fill="#14161b"/>
      <rect x="130" y="34" width="58" height="30" fill="#8a5b7d"/>
      <rect x="136" y="40" width="24" height="18" fill="#14161b"/>
      <rect x="74" y="120" width="58" height="30" fill="#f5c518"/>
      <rect x="80" y="126" width="24" height="18" fill="#14161b"/>
    </g>
    <path d="M108 132h64c14 0 22-6 24-14" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 8" fill="none" stroke-linecap="round"/>`,
  mania2: `
    <rect width="320" height="180" fill="transparent"/>
    <rect x="0" y="0" width="320" height="66" fill="#121a2b"/>
    <path d="M0 66h320" stroke="#1d2943" stroke-width="4"/>
    <g>
      <rect x="28" y="14" width="60" height="34" rx="7" fill="#46609a"/>
      <rect x="104" y="14" width="60" height="34" rx="7" fill="#66748f"/>
      <rect x="234" y="14" width="60" height="34" rx="7" fill="#8a5b7d"/>
      <rect x="174" y="8" width="50" height="46" rx="5" fill="#0e1524" stroke="#f5c518" stroke-width="2" stroke-dasharray="8 7"/>
    </g>
    <g transform="translate(74 122) rotate(4)">
      <rect x="-34" y="-17" width="68" height="34" rx="9" fill="#f5c518"/>
      <rect x="-8" y="-11" width="26" height="22" rx="4" fill="#14161b"/>
      <circle cx="27" cy="-12" r="3.5" fill="#f4f7fb"/><circle cx="27" cy="12" r="3.5" fill="#f4f7fb"/>
    </g>
    <g transform="translate(228 126) rotate(-6)">
      <rect x="-34" y="-17" width="68" height="34" rx="9" fill="#24314f"/>
      <rect x="-8" y="-11" width="26" height="22" rx="4" fill="#14161b"/>
      <circle cx="27" cy="-12" r="3.5" fill="#f4f7fb"/><circle cx="27" cy="12" r="3.5" fill="#f4f7fb"/>
    </g>
    <path d="M116 104c26-14 38-26 44-44" stroke="#f5c518" stroke-width="2.5" stroke-dasharray="3 9" fill="none" stroke-linecap="round"/>
    <path d="M204 104c-14-14-16-26-14-42" stroke="#8d9ab1" stroke-width="2.5" stroke-dasharray="3 9" fill="none" stroke-linecap="round"/>`,
};
