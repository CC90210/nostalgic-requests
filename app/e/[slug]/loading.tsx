export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black gap-4">
      <div className="h-12 w-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      <h1 className="text-xl font-bold text-purple-500 animate-pulse">LOADING EVENT...</h1>
    </div>
  );
}
