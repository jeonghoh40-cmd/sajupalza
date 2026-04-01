"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { UnifiedTraits } from "@/lib/types";

const TRAIT_LABELS: Record<keyof UnifiedTraits, string> = {
  leadership: "리더십",
  creativity: "창의성",
  analytical: "분석력",
  stability: "안정성",
  social: "사교성",
  adventure: "모험성",
  intuition: "직관",
  service: "봉사",
};

interface Props {
  traits: UnifiedTraits;
  color?: string;
}

export default function RadarChart({ traits, color = "#a855f7" }: Props) {
  const data = Object.entries(TRAIT_LABELS).map(([key, label]) => ({
    trait: label,
    value: traits[key as keyof UnifiedTraits],
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#2d2a45" />
        <PolarAngleAxis
          dataKey="trait"
          tick={{ fill: "#8b85a8", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
