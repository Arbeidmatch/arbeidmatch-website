export default function JobsLoading() {
  return (
    <div
      className="min-h-[calc(100vh-4rem)] animate-pulse"
      style={{
        background: "linear-gradient(165deg, #0B1424 0%, #0f1f38 42%, #0a1222 100%)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col justify-center px-6 py-20 sm:px-8">
        <div className="mx-auto h-3 w-24 rounded-full bg-white/10" />
        <div className="mx-auto mt-6 h-10 w-4/5 max-w-md rounded-md bg-white/10" />
        <div className="mx-auto mt-4 h-6 w-full max-w-sm rounded-md bg-white/10" />
        <div className="mx-auto mt-12 h-12 w-full rounded-lg bg-white/10" />
      </div>
    </div>
  );
}
