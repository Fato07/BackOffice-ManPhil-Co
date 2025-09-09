export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <p className="text-gray-500">This section is under construction.</p>
    </div>
  )
}