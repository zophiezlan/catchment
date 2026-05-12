// Extract coordinate rings from WKT polygon text by scanning for numeric tuple groups.
export function extractRings(wkt) {
  const rings = [];
  let i = 0;

  while (i < wkt.length) {
    if (wkt[i] === "(") {
      let j = i + 1;
      while (
        j < wkt.length &&
        (wkt[j] === " " || wkt[j] === "\t" || wkt[j] === "\n" || wkt[j] === "\r")
      ) {
        j++;
      }

      const startsWithNumber =
        j < wkt.length &&
        (wkt[j] === "-" || (wkt[j] >= "0" && wkt[j] <= "9"));

      if (startsWithNumber) {
        let end = j;
        while (end < wkt.length && wkt[end] !== ")") end++;

        const pts = wkt
          .slice(i + 1, end)
          .split(",")
          .map((pair) => {
            const parts = pair.trim().split(/\s+/);
            return [parseFloat(parts[0]), parseFloat(parts[1])];
          })
          .filter((p) => !isNaN(p[0]) && !isNaN(p[1]));

        if (pts.length >= 4) rings.push(pts);
        i = end + 1;
        continue;
      }
    }

    i++;
  }

  return rings;
}
