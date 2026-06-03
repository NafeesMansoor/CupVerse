import { getScore } from './storage.js';

export async function generateShareCard(match) {
  const score = getScore(match.id) || match.score;
  const scoreText = score ? `${score.home} – ${score.away}` : 'vs';

  const card = document.createElement('div');
  Object.assign(card.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    width: '640px',
    padding: '40px 36px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 60%, #0d1b3e 100%)',
    color: '#f0f0f5',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    border: '1px solid rgba(59,111,212,0.35)',
  });

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
      <div>
        <div style="font-size:0.85rem;color:#5b8ef4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">CupVerse</div>
        <div style="font-size:1.1rem;font-weight:700;color:#f0f0f5;">${match.stage}${match.group ? ` · Group ${match.group}` : ''}</div>
      </div>
      <div style="text-align:right;color:#666680;font-size:0.88rem;line-height:1.5;">
        ${match.venueInfo?.city || match.stadium}<br/>
        ${new Date(match.datetime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;margin-bottom:28px;">
      <div style="text-align:center;">
        <div style="font-size:4rem;margin-bottom:10px;">${match.homeTeam.flag}</div>
        <div style="font-size:1.2rem;font-weight:700;">${match.homeTeam.name}</div>
      </div>
      <div style="text-align:center;font-size:${score ? '3.5rem' : '1.6rem'};font-weight:900;color:${score ? '#5b8ef4' : '#666680'};letter-spacing:0.05em;white-space:nowrap;">
        ${scoreText}
      </div>
      <div style="text-align:center;">
        <div style="font-size:4rem;margin-bottom:10px;">${match.awayTeam.flag}</div>
        <div style="font-size:1.2rem;font-weight:700;">${match.awayTeam.name}</div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:0.82rem;color:#666680;">🏟️ ${match.venueInfo?.fullName || match.stadium}</span>
      <span style="font-size:0.82rem;color:#3b6fd4;font-weight:600;">cupverse.app</span>
    </div>
  `;

  document.body.appendChild(card);
  try {
    const canvas = await html2canvas(card, {
      backgroundColor: '#0f0f13',
      scale: 2,
      logging: false,
    });
    const url = canvas.toDataURL('image/png');

    // Try Web Share API first
    if (navigator.share && navigator.canShare) {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `cupverse-match-${match.id}.png`, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${match.homeTeam.name} vs ${match.awayTeam.name} · CupVerse` });
        return;
      }
    }

    // Fallback: download
    const a = document.createElement('a');
    a.href = url;
    a.download = `cupverse-match-${match.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    card.remove();
  }
}
