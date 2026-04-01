import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 왼쪽: 양력(태양) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "50%",
            height: "100%",
            background: "linear-gradient(180deg, #f59e0b 0%, #ec4899 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 64, marginLeft: 24 }}>☀</div>
        </div>
        {/* 오른쪽: 음력(달) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "100%",
            background: "linear-gradient(180deg, #6366f1 0%, #7c3aed 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 64, marginRight: 24 }}>☽</div>
        </div>
        {/* 중앙 텍스트 */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              color: "white",
              fontWeight: "bold",
              fontFamily: "serif",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              lineHeight: 1,
            }}
          >
            四柱
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
