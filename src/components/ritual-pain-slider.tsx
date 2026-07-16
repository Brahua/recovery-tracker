import type { CSSProperties } from "react";

import type { PainScore } from "@/types/recovery";

interface RitualPainSliderProps {
  label: string;
  name: string;
  onChange: (value: PainScore) => void;
  value: PainScore | null;
}

export function RitualPainSlider({
  label,
  name,
  onChange,
  value,
}: RitualPainSliderProps) {
  const numericValue = value ?? 0;
  const style = {
    "--rr-range-progress": `${numericValue * 10}%`,
    "--rr-slider-position": numericValue / 10,
  } as CSSProperties;

  return (
    <label className={`rr-pain-row ${value === null ? "is-unset" : ""}`} style={style}>
      <span>{label}</span>
      <span className="rr-pain-control">
        <input
          aria-valuetext={value === null ? "Sin registrar" : `${value} de 10`}
          max="10"
          min="0"
          onChange={(event) => onChange(Number(event.target.value) as PainScore)}
          step="1"
          type="range"
          value={numericValue}
        />
        <output>{value ?? ""}</output>
      </span>
      {value !== null ? <input name={name} type="hidden" value={value} /> : null}
    </label>
  );
}
