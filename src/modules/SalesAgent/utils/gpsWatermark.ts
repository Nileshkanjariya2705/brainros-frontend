/**
 * GPS Map Camera Watermarker
 * Stamps authentic GPS metadata, reverse-geocoded location, coordinates, timestamp,
 * and mini map graphics onto field visit photos.
 */

export interface GpsWatermarkData {
  latitude: number;
  longitude: number;
  locationAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  timestamp?: Date;
}

/**
 * Formats a date in GPS Camera style: "Thursday, 20/08/2026 09:47 AM GMT +05:30"
 */
export function formatGpsTimestamp(date: Date = new Date()): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 -> 12
  const formattedHours = String(hours).padStart(2, '0');

  // Timezone offset
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const offsetStr = `GMT ${sign}${pad(offset / 60)}:${pad(offset % 60)}`;

  return `${dayName}, ${dd}/${mm}/${yyyy} ${formattedHours}:${minutes} ${ampm} ${offsetStr}`;
}

/**
 * Draws rounded rectangle helper
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draws stylized mini map thumbnail with map roads and Google-style pin
 */
function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  _lat?: number,
  _lng?: number,
) {
  ctx.save();
  // Clip to rounded square
  drawRoundedRect(ctx, x, y, size, size, 12);
  ctx.clip();

  // 1. Map satellite/terrain background gradient
  const bgGrad = ctx.createLinearGradient(x, y, x + size, y + size);
  bgGrad.addColorStop(0, '#2d3748');
  bgGrad.addColorStop(0.5, '#1a202c');
  bgGrad.addColorStop(1, '#171923');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(x, y, size, size);

  // 2. Decorative map road vectors
  ctx.strokeStyle = 'rgba(113, 128, 150, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.lineTo(x + size * 0.45, y + size * 0.35);
  ctx.lineTo(x + size * 0.65, y + size * 0.85);
  ctx.lineTo(x + size, y + size * 0.85);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(74, 85, 104, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.45, y);
  ctx.lineTo(x + size * 0.45, y + size);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.2, y + size);
  ctx.lineTo(x + size * 0.8, y);
  ctx.stroke();

  // Secondary highway route
  ctx.strokeStyle = 'rgba(237, 137, 54, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.6);
  ctx.lineTo(x + size * 0.5, y + size * 0.5);
  ctx.lineTo(x + size * 0.8, y + size * 0.2);
  ctx.lineTo(x + size, y + size * 0.15);
  ctx.stroke();

  // 3. Red Map Pin at center
  const pinX = x + size * 0.48;
  const pinY = y + size * 0.46;

  // Pin shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(pinX, pinY + 16, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red Pin Body
  ctx.fillStyle = '#e53e3e';
  ctx.beginPath();
  ctx.arc(pinX, pinY, 9, Math.PI, 0, false);
  ctx.lineTo(pinX, pinY + 16);
  ctx.closePath();
  ctx.fill();

  // White inner dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(pinX, pinY, 4, 0, Math.PI * 2);
  ctx.fill();

  // 4. "Google" logo branding watermark
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText('Google', x + 8, y + size - 8);
  ctx.shadowBlur = 0;

  ctx.restore();
}

/**
 * Text word wrap helper for canvas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const words = text.split(' ');
  let line = '';
  let linesCount = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      linesCount++;
      if (linesCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

/**
 * Main Stamp Function: Takes raw image source + GPS metadata and outputs stamped image File/Blob
 */
export async function stampGpsWatermark(
  imageSource: string | HTMLImageElement | File | Blob,
  gpsData: GpsWatermarkData,
): Promise<{ file: File; dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrlToRevoke: string | null = null;
    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof HTMLImageElement) {
      img.src = imageSource.src;
    } else {
      objectUrlToRevoke = URL.createObjectURL(imageSource);
      img.src = objectUrlToRevoke;
    }

    img.onload = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context not available.');
        }

        // Target standard high-res photo dimensions
        const maxDim = 1600;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 1. Draw base photo
        ctx.drawImage(img, 0, 0, width, height);

        // Compute scaling ratio relative to a baseline 1080px width
        const scale = Math.max(0.65, Math.min(1.6, width / 1080));

        // 2. Overlay Card dimensions
        const marginX = 20 * scale;
        const marginB = 24 * scale;
        const cardW = width - marginX * 2;
        const cardH = 220 * scale;
        const cardX = marginX;
        const cardY = height - marginB - cardH;

        // Draw Card Background (Frosted dark glass with border)
        ctx.save();
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20 * scale);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'; // Dark slate with opacity
        ctx.fill();

        ctx.lineWidth = 1.5 * scale;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();
        ctx.restore();

        // 3. Mini Map on Left
        const mapPadding = 16 * scale;
        const mapSize = cardH - mapPadding * 2;
        const mapX = cardX + mapPadding;
        const mapY = cardY + mapPadding;

        drawMiniMap(ctx, mapX, mapY, mapSize, gpsData.latitude, gpsData.longitude);

        // 4. GPS Map Camera Logo in Top Right of Overlay
        ctx.save();
        const badgeX = cardX + cardW - 145 * scale;
        const badgeY = cardY + 14 * scale;
        const badgeW = 130 * scale;
        const badgeH = 26 * scale;

        drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 6 * scale);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();

        ctx.font = `bold ${11 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('📷 GPS Map Camera', badgeX + 8 * scale, badgeY + 17 * scale);
        ctx.restore();

        // 5. Text Info on Right of Map
        const textX = mapX + mapSize + 16 * scale;
        const textMaxW = cardW - (mapSize + mapPadding * 2) - 16 * scale;
        let textY = cardY + 28 * scale;

        // Header: City, State, Country 🇮🇳
        const cityState = [gpsData.city, gpsData.state, gpsData.country || 'India']
          .filter(Boolean)
          .join(', ');
        const locationTitle = cityState || 'Verified Location, India';

        ctx.font = `bold ${21 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${locationTitle} 🇮🇳`, textX, textY);
        textY += 22 * scale;

        // Street / Full Address
        ctx.font = `500 ${14 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#e2e8f0';
        const rawAddr = gpsData.locationAddress || `${gpsData.latitude.toFixed(5)}, ${gpsData.longitude.toFixed(5)}`;
        textY = wrapText(ctx, rawAddr, textX, textY, textMaxW - 10 * scale, 17 * scale, 2);

        // Coordinates line
        ctx.font = `bold ${13 * scale}px system-ui, monospace`;
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(
          `Lat ${gpsData.latitude.toFixed(6)}° Long ${gpsData.longitude.toFixed(6)}°`,
          textX,
          textY + 2 * scale,
        );
        textY += 18 * scale;

        // Timestamp line
        const timestampStr = formatGpsTimestamp(gpsData.timestamp || new Date());
        ctx.font = `500 ${13 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(timestampStr, textX, textY + 2 * scale);

        // 6. Export canvas as Blob & File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate watermarked photo blob.'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const file = new File([blob], `gps_visit_${Date.now()}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({ file, dataUrl, blob });
          },
          'image/jpeg',
          0.92,
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      reject(new Error('Failed to load image for watermarking.'));
    };
  });
}
