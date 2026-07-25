export default function Logo({ width = 220, showTagline = false }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} viewBox="0 0 530 150">
        {/*Background and checkmark*/}
      <rect x="0" y="10" width="72" height="62" rx="14" fill="#2563EB"/>
      <polygon points="6,72 22,72 10,88" fill="#2563EB"/>
      <polyline points="16,41 30,55 56,27" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        {/*Name*/}
      <text x="88" y="66" style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, letterSpacing: -1 }}>
         <tspan style={{ fontWeight: 700, fill: '#22f3d7' }}>Hello</tspan>
         <tspan style={{ fontWeight: 400, fill: '#cacaca' }}> College</tspan>
        </text>

        {/*description*/}
      {showTagline && (
        <>
          <line x1="88" y1="78" x2="430" y2="78" stroke="#E2E8F0" strokeWidth="1"/>
          <text x="89" y="96" style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: '#64748B', letterSpacing: 0.4 }}>
            Student Feedback &amp; Complaint Portal
          </text>
        </>
      )}
    </svg>
  );
}