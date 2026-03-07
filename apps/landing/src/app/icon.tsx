import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#06060a',
          borderRadius: 4,
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#ef4444',
            lineHeight: 1,
          }}
        >
          //
        </span>
      </div>
    ),
    { ...size },
  );
}
