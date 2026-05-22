export default function ImageGrid({ images, columns = 4 }) {
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {images.map((img, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <img src={img.url} alt="" className="w-full aspect-square object-cover" />
        </div>
      ))}
    </div>
  )
}
