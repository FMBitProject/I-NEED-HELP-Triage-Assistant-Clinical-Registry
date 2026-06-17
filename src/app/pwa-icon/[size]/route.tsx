import { ImageResponse } from "next/og";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const s = Math.min(Math.max(parseInt(size) || 192, 16), 512);

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.round(s * 0.18),
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: Math.round(s * 0.44),
              color: "#ef4444",
              lineHeight: 1,
            }}
          >
            ♥
          </div>
          <div
            style={{
              fontSize: Math.round(s * 0.12),
              color: "white",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              lineHeight: 1,
              marginTop: Math.round(s * 0.04),
            }}
          >
            I-NEED-HELP
          </div>
        </div>
      </div>
    ),
    { width: s, height: s }
  );
}
