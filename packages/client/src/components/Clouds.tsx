/** A band of puffy clouds that closes a space banner: a pale back row and a front row in the page colour. */
export function Clouds() {
  // Bumps along the top edge: [centre x, radius] in a 1440-wide box.
  const front = [[40, 70], [170, 95], [330, 70], [470, 100], [640, 80], [800, 105], [970, 75], [1110, 100], [1270, 80], [1420, 90]];
  const back = [[100, 90], [260, 110], [420, 85], [580, 120], [740, 95], [900, 125], [1060, 90], [1220, 115], [1380, 100]];
  return (
    <svg className="clouds" viewBox="0 0 1440 170" preserveAspectRatio="none" aria-hidden>
      <g className="clouds-back">
        {back.map(([x, r]) => (
          <circle key={x} cx={x} cy={150} r={r} />
        ))}
      </g>
      <g fill="var(--bg)">
        {front.map(([x, r]) => (
          <circle key={x} cx={x} cy={185} r={r} />
        ))}
        <rect x="0" y="150" width="1440" height="20" />
      </g>
    </svg>
  );
}
