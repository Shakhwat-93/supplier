/**
 * High-fidelity authentic business card SVG renderer
 * Produces realistic front and back Chinese business cards matching reference
 */

export interface CardRenderOptions {
  companyName: string;
  chineseName?: string;
  logoText: string;
  contactPerson: string;
  position?: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  themeColor: string;
  accentColor: string;
  style: 'navy-corporate' | 'textile-minimal' | 'playful-toys' | 'tech-dark' | 'packaging-modern' | 'hardware-industrial' | 'luxury-gold' | 'clean-white';
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateQRCodeSVG(x: number, y: number, size: number, color: string = '#000000'): string {
  const modules = [
    [1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0],
    [1,1,0,1,0,1,1,1,0,0,1,0,1,1,0,1,0,1,1,0,1],
    [0,1,1,0,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,1,0],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,0,1],
    [0,0,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,0,1,1,0],
    [1,1,0,1,0,0,1,0,1,1,0,1,1,0,1,0,0,1,0,1,1],
    [0,0,0,0,0,0,0,0,1,0,1,0,1,1,0,1,1,0,1,0,0],
    [1,1,1,1,1,1,1,0,1,1,0,1,0,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,1,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,1,1,1,0,0,1,1,0],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,0,0,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,0,1,0],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,1,1,1,0,1,0,0,1],
    [1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,0,1,0,1,1,1],
  ];

  const mSize = size / 21;
  let rects = '';
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      if (modules[r][c] === 1) {
        rects += `<rect x="${(x + c * mSize).toFixed(1)}" y="${(y + r * mSize).toFixed(1)}" width="${mSize.toFixed(1)}" height="${mSize.toFixed(1)}" fill="${color}"/>`;
      }
    }
  }
  return rects;
}

export function renderCardFrontSVG(opts: CardRenderOptions): string {
  const companyName = escapeXML(opts.companyName);
  const chineseName = escapeXML(opts.chineseName || '实业有限公司');
  const logoText = escapeXML(opts.logoText);
  const contactPerson = escapeXML(opts.contactPerson);
  const position = escapeXML(opts.position || 'General Manager');
  const phone = escapeXML(opts.phone);
  const email = escapeXML(opts.email);
  const website = escapeXML(opts.website);
  const address = escapeXML(opts.address);
  const themeColor = opts.themeColor;
  const style = opts.style;

  let content = '';

  if (style === 'tech-dark') {
    // Dark modern electronic card
    content = `
      <rect width="800" height="480" rx="20" fill="#0c1017"/>
      <path d="M0,0 L320,0 L200,480 L0,480 Z" fill="#141c2b" opacity="0.8"/>
      <path d="M180,0 L220,0 L120,480 L80,480 Z" fill="#1e293b" opacity="0.4"/>
      
      <!-- Tech circuit subtle lines -->
      <path d="M 40,240 L 160,240 L 200,280 L 300,280" stroke="#0284c7" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="300" cy="280" r="4" fill="#38bdf8"/>
      
      <!-- Logo -->
      <g transform="translate(60, 60)">
        <rect width="90" height="50" rx="8" fill="#0284c7" fill-opacity="0.2" stroke="#38bdf8" stroke-width="2"/>
        <text x="45" y="34" font-family="'Inter', sans-serif" font-weight="900" font-size="24" fill="#38bdf8" text-anchor="middle" letter-spacing="2">${logoText}</text>
      </g>
      
      <text x="170" y="85" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="700" font-size="22" fill="#ffffff">${chineseName}</text>
      <text x="170" y="105" font-family="'Inter', sans-serif" font-weight="600" font-size="14" fill="#94a3b8" letter-spacing="1">${companyName.toUpperCase()}</text>

      <!-- Contact Info -->
      <g transform="translate(60, 180)">
        <text x="0" y="40" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="700" font-size="28" fill="#ffffff">${contactPerson}</text>
        <text x="0" y="65" font-family="'Inter', sans-serif" font-weight="500" font-size="14" fill="#38bdf8">${position}</text>

        <g transform="translate(0, 110)">
          <!-- Phone -->
          <circle cx="10" cy="8" r="10" fill="#1e293b"/>
          <path d="M 7,4 C 6,4 5,6 6,8 C 7,10 9,12 11,13 C 13,14 15,13 15,12" stroke="#38bdf8" stroke-width="1.5" fill="none"/>
          <text x="32" y="13" font-family="'Inter', sans-serif" font-weight="500" font-size="15" fill="#f1f5f9">${phone}</text>
          
          <!-- Email -->
          <circle cx="10" cy="40" r="10" fill="#1e293b"/>
          <text x="32" y="45" font-family="'Inter', sans-serif" font-weight="400" font-size="14" fill="#94a3b8">${email}</text>

          <!-- Web -->
          <circle cx="10" cy="72" r="10" fill="#1e293b"/>
          <text x="32" y="77" font-family="'Inter', sans-serif" font-weight="500" font-size="14" fill="#38bdf8">${website}</text>

          <!-- Address -->
          <circle cx="10" cy="104" r="10" fill="#1e293b"/>
          <text x="32" y="109" font-family="'PingFang SC', sans-serif" font-weight="400" font-size="13" fill="#64748b">${address}</text>
        </g>
      </g>
    `;
  } else if (style === 'playful-toys') {
    // Colorful toy factory card with playful badge
    content = `
      <rect width="800" height="480" rx="20" fill="#fffdfa"/>
      <!-- Colorful decorative pattern -->
      <path d="M0,0 L800,0 L800,80 Q400,120 0,60 Z" fill="#fef3c7" opacity="0.6"/>
      <circle cx="50" cy="50" r="28" fill="#f87171" opacity="0.8"/>
      <circle cx="740" cy="80" r="45" fill="#38bdf8" opacity="0.7"/>
      <circle cx="700" cy="420" r="50" fill="#fbbf24" opacity="0.5"/>
      <circle cx="100" cy="430" r="35" fill="#34d399" opacity="0.6"/>

      <!-- Center-Left Logo Badge -->
      <g transform="translate(80, 70)">
        <circle cx="50" cy="50" r="45" fill="#0284c7" stroke="#38bdf8" stroke-width="4"/>
        <text x="50" y="60" font-family="'Inter', sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">${logoText}</text>
      </g>

      <g transform="translate(195, 80)">
        <text x="0" y="32" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="800" font-size="28" fill="#1e293b">${chineseName}</text>
        <text x="0" y="58" font-family="'Inter', sans-serif" font-weight="600" font-size="15" fill="#f97316" letter-spacing="1">${companyName}</text>
      </g>

      <line x1="80" y1="180" x2="720" y2="180" stroke="#f1f5f9" stroke-width="2"/>

      <g transform="translate(80, 220)">
        <text x="0" y="35" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="700" font-size="32" fill="#0f172a">${contactPerson}</text>
        <rect x="140" y="12" width="130" height="26" rx="13" fill="#ffedd5"/>
        <text x="205" y="29" font-family="'Inter', sans-serif" font-weight="600" font-size="12" fill="#ea580c" text-anchor="middle">${position}</text>

        <g transform="translate(0, 75)">
          <text x="0" y="18" font-family="'Inter', sans-serif" font-weight="600" font-size="16" fill="#1e293b">TEL: ${phone}</text>
          <text x="0" y="48" font-family="'Inter', sans-serif" font-weight="500" font-size="15" fill="#475569">EMAIL: ${email}</text>
          <text x="0" y="78" font-family="'Inter', sans-serif" font-weight="600" font-size="15" fill="#0284c7">WEB: ${website}</text>
          <text x="0" y="108" font-family="'PingFang SC', sans-serif" font-weight="400" font-size="13" fill="#64748b">ADD: ${address}</text>
        </g>
      </g>
    `;
  } else {
    // High-end Chinese Corporate / Minimal Business Card (White & Blue as in Reference XHY / Kangda)
    content = `
      <rect width="800" height="480" rx="20" fill="#ffffff"/>
      <rect width="800" height="480" rx="20" fill="none" stroke="#e2e8f0" stroke-width="2"/>
      
      <!-- Subtle modern geometric accent in top right or corner -->
      <path d="M560,480 L800,280 L800,480 Z" fill="${themeColor}" fill-opacity="0.95"/>
      <path d="M530,480 L560,480 L800,280 L800,250 Z" fill="${themeColor}" fill-opacity="0.3"/>

      <!-- Company Logo & Name Header -->
      <g transform="translate(60, 60)">
        <!-- Logo Emblem -->
        <g>
          <rect width="86" height="48" rx="8" fill="#eff6ff" stroke="${themeColor}" stroke-width="2.5"/>
          <text x="43" y="33" font-family="'Inter', sans-serif" font-weight="900" font-size="24" fill="${themeColor}" text-anchor="middle" letter-spacing="1">${logoText}</text>
        </g>
        
        <!-- Chinese & English Company Name -->
        <text x="108" y="28" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="700" font-size="22" fill="#0f172a">${chineseName}</text>
        <text x="108" y="48" font-family="'Inter', sans-serif" font-weight="600" font-size="13" fill="#475569" letter-spacing="0.5">${companyName}</text>
      </g>

      <!-- Divider line -->
      <line x1="60" y1="135" x2="480" y2="135" stroke="#f1f5f9" stroke-width="2"/>

      <!-- Contact Person & Title -->
      <g transform="translate(60, 160)">
        <text x="0" y="40" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="700" font-size="30" fill="#0f172a">${contactPerson}</text>
        <rect x="0" y="55" width="120" height="22" rx="4" fill="#f1f5f9"/>
        <text x="60" y="70" font-family="'Inter', sans-serif" font-weight="600" font-size="12" fill="#475569" text-anchor="middle">${position}</text>
        
        <!-- Details List -->
        <g transform="translate(0, 110)">
          <!-- Mobile / Phone -->
          <text x="0" y="16" font-family="'Inter', sans-serif" font-weight="700" font-size="16" fill="#1e293b">TEL: ${phone}</text>
          
          <!-- Email -->
          <text x="0" y="44" font-family="'Inter', sans-serif" font-weight="500" font-size="14" fill="#475569">E-MAIL: ${email}</text>

          <!-- Website -->
          <text x="0" y="72" font-family="'Inter', sans-serif" font-weight="600" font-size="14" fill="${themeColor}">WEB: ${website}</text>

          <!-- Address -->
          <text x="0" y="100" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="400" font-size="12" fill="#64748b">ADD: ${address}</text>
        </g>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">${content}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function renderCardBackSVG(opts: CardRenderOptions): string {
  const companyName = escapeXML(opts.companyName);
  const chineseName = escapeXML(opts.chineseName || '实业有限公司');
  const logoText = escapeXML(opts.logoText);
  const website = escapeXML(opts.website);
  const themeColor = opts.themeColor;
  const style = opts.style;

  let content = '';

  if (style === 'tech-dark') {
    content = `
      <rect width="800" height="480" rx="20" fill="#080c14"/>
      <rect width="800" height="480" rx="20" fill="none" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Center Emblem -->
      <g transform="translate(140, 140)">
        <rect width="120" height="66" rx="12" fill="#0f172a" stroke="#0284c7" stroke-width="3"/>
        <text x="60" y="44" font-family="'Inter', sans-serif" font-weight="900" font-size="32" fill="#38bdf8" text-anchor="middle" letter-spacing="2">${logoText}</text>
        <text x="60" y="100" font-family="'PingFang SC', sans-serif" font-weight="700" font-size="22" fill="#ffffff" text-anchor="middle">${chineseName}</text>
        <text x="60" y="125" font-family="'Inter', sans-serif" font-weight="600" font-size="13" fill="#94a3b8" text-anchor="middle" letter-spacing="1">${companyName.toUpperCase()}</text>
        <text x="60" y="160" font-family="'Inter', sans-serif" font-weight="500" font-size="14" fill="#0284c7" text-anchor="middle">${website}</text>
      </g>

      <!-- QR Code on Right (relative coordinates 20, 20 inside translated group) -->
      <g transform="translate(530, 130)">
        <rect width="180" height="180" rx="14" fill="#ffffff"/>
        ${generateQRCodeSVG(20, 20, 140, '#0f172a')}
        <text x="90" y="210" font-family="'Inter', sans-serif" font-weight="500" font-size="12" fill="#94a3b8" text-anchor="middle">SCAN FOR CATALOG</text>
      </g>
    `;
  } else if (style === 'playful-toys') {
    content = `
      <rect width="800" height="480" rx="20" fill="#f97316"/>
      <circle cx="100" cy="100" r="220" fill="#ea580c" opacity="0.6"/>
      <circle cx="700" cy="380" r="180" fill="#fb923c" opacity="0.5"/>

      <!-- Large White Emblem -->
      <g transform="translate(120, 140)">
        <circle cx="60" cy="60" r="56" fill="#ffffff"/>
        <text x="60" y="72" font-family="'Inter', sans-serif" font-weight="900" font-size="40" fill="#ea580c" text-anchor="middle">${logoText}</text>
        <text x="60" y="150" font-family="'PingFang SC', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">${chineseName}</text>
        <text x="60" y="180" font-family="'Inter', sans-serif" font-weight="600" font-size="16" fill="#ffedd5" text-anchor="middle">${companyName}</text>
      </g>

      <!-- QR Code in white box -->
      <g transform="translate(530, 130)">
        <rect width="180" height="180" rx="16" fill="#ffffff"/>
        ${generateQRCodeSVG(20, 20, 140, '#ea580c')}
        <text x="90" y="210" font-family="'Inter', sans-serif" font-weight="600" font-size="12" fill="#ffffff" text-anchor="middle">OFFICIAL WECHAT / WEB</text>
      </g>
    `;
  } else {
    // Rich Deep Navy Blue Back Side (Exactly like XHY in reference screenshot!)
    content = `
      <rect width="800" height="480" rx="20" fill="${themeColor}"/>
      
      <!-- Subtle concentric wave or line pattern -->
      <circle cx="400" cy="240" r="360" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.08"/>
      <circle cx="400" cy="240" r="280" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.06"/>
      <circle cx="400" cy="240" r="200" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.05"/>

      <!-- Center-Left Branding -->
      <g transform="translate(80, 140)">
        <!-- Emblem -->
        <rect width="90" height="52" rx="10" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-width="2"/>
        <text x="45" y="36" font-family="'Inter', sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle" letter-spacing="2">${logoText}</text>
        
        <text x="0" y="110" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="700" font-size="26" fill="#ffffff">${chineseName}</text>
        <text x="0" y="140" font-family="'Inter', sans-serif" font-weight="600" font-size="14" fill="#bfdbfe" letter-spacing="1">${companyName.toUpperCase()}</text>
        
        <g transform="translate(0, 175)">
          <text x="0" y="0" font-family="'PingFang SC', sans-serif" font-weight="400" font-size="12" fill="#93c5fd">专业品质 • 诚意合作 • 智造全球</text>
          <text x="0" y="22" font-family="'Inter', sans-serif" font-weight="500" font-size="13" fill="#ffffff">${website}</text>
        </g>
      </g>

      <!-- Realistic Crisp QR Code on Right (Matching the reference screenshot!) -->
      <g transform="translate(540, 130)">
        <rect width="180" height="180" rx="14" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
        ${generateQRCodeSVG(15, 15, 150, '#0f172a')}
        <text x="90" y="210" font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="#bfdbfe" text-anchor="middle" letter-spacing="0.5">SCAN FOR CATALOGUE</text>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">${content}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
