type Props = {
  id: string;
  content: string;
};

export default function DiaryDetails({ id, content }: Props) {
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
      {content}
    </div>
  );
}
