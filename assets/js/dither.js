(function () {

  // Site palette — mirrors the CSS gradient stops
  const PALETTE = [
    [255, 252, 247],  // #FFFCF7  cream
    [178, 216, 216],  // #B2D8D8  light teal
    [157, 196, 176],  // #9DC4B0  sage
    [  0, 121, 107],  // #00796B  deep teal
    [ 44,  44,  42],  // #2C2C2A  near-black
  ];

  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }

  function nearest(r, g, b) {
    let best = PALETTE[0], dist = Infinity;
    for (const c of PALETTE) {
      const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
      if (d < dist) { dist = d; best = c; }
    }
    return best;
  }

  function floydSteinberg(img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const id  = ctx.getImageData(0, 0, w, h);
    const d   = id.data;
    const row = w * 4;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * row + x * 4;

        const [nr, ng, nb] = nearest(d[i], d[i + 1], d[i + 2]);
        const er = d[i]     - nr;
        const eg = d[i + 1] - ng;
        const eb = d[i + 2] - nb;
        d[i] = nr; d[i + 1] = ng; d[i + 2] = nb;

        // Floyd-Steinberg error diffusion
        //         X   7/16
        //  3/16  5/16  1/16
        if (x + 1 < w) {
          d[i + 4]   = clamp(d[i + 4]   + er * 7 / 16);
          d[i + 5]   = clamp(d[i + 5]   + eg * 7 / 16);
          d[i + 6]   = clamp(d[i + 6]   + eb * 7 / 16);
        }
        if (y + 1 < h) {
          if (x > 0) {
            const j = i + row - 4;
            d[j]     = clamp(d[j]     + er * 3 / 16);
            d[j + 1] = clamp(d[j + 1] + eg * 3 / 16);
            d[j + 2] = clamp(d[j + 2] + eb * 3 / 16);
          }
          const k = i + row;
          d[k]     = clamp(d[k]     + er * 5 / 16);
          d[k + 1] = clamp(d[k + 1] + eg * 5 / 16);
          d[k + 2] = clamp(d[k + 2] + eb * 5 / 16);
          if (x + 1 < w) {
            const l = i + row + 4;
            d[l]     = clamp(d[l]     + er * 1 / 16);
            d[l + 1] = clamp(d[l + 1] + eg * 1 / 16);
            d[l + 2] = clamp(d[l + 2] + eb * 1 / 16);
          }
        }
      }
    }

    ctx.putImageData(id, 0, 0);

    // Swap src while image is still opacity:0 (pre-scroll), so no visible flash
    canvas.toBlob(blob => { img.src = URL.createObjectURL(blob); });
  }

  function processImage(img) {
    if (img.complete && img.naturalWidth) {
      floydSteinberg(img);
    } else {
      img.addEventListener('load', () => floydSteinberg(img), { once: true });
    }
  }

  document.querySelectorAll('img.scene').forEach(processImage);

})();
