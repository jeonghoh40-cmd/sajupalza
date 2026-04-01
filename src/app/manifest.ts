import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "사주팔자 - 운명 캐릭터카드",
    short_name: "사주팔자",
    description: "사주, 자미두수, 수비학, MBTI 교차검증으로 운명 캐릭터카드를 만들어 드립니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a1a",
    theme_color: "#0c0a1a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
