import dayjs from "dayjs";
import {
  RiEmotionHappyLine,
  RiFlashlightLine,
  RiPulseLine,
} from "react-icons/ri";

type Props = {
  id: string;
  content: string;
  emotion: number;
  energy: number;
  intensity: number;
  createdAt: Date;
};

type StatProps = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

function Stat({ icon, value, label }: StatProps) {
  return (
    <span className="flex items-center gap-1">
      <span className="relative group">
        <span className="text-white/40">{icon}</span>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-black/90 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          {label}
        </span>
      </span>
      <span>{value}</span>
    </span>
  );
}

export default function DiaryDetails({
  id,
  content,
  emotion,
  energy,
  intensity,
  createdAt,
}: Props) {
  const date = dayjs(createdAt).format("YYYY/MM/DD HH:mm:ss");

  return (
    <div
      id={`details-${id}`}
      popover="auto"
      className="max-w-xs mb-2 px-4 py-3 rounded-xl
        bg-white/10 backdrop-blur-md border border-white/20
        text-white text-sm shadow-xl"
      style={{
        positionArea: "top span-all",
      }}
    >
      <p className="mb-2">{content}</p>
      <div className="flex flex-col gap-1 text-xs text-white/60">
        <div className="flex items-center gap-3">
          <Stat
            icon={<RiEmotionHappyLine />}
            value={String(emotion)}
            label="ポジティブ度"
          />
          <Stat
            icon={<RiFlashlightLine />}
            value={String(energy)}
            label="エネルギー"
          />
          <Stat
            icon={<RiPulseLine />}
            value={String(intensity)}
            label="感情の強さ"
          />
        </div>
        <span>{date}</span>
      </div>
    </div>
  );
}
