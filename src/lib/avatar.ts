// Resizes/crops an uploaded image client-side to a small square JPEG data
// URI before it ever reaches the network — keeps the backend's avatar
// column tiny (see internal/service/auth's maxAvatarLength) without
// needing any object storage for something this size.
export function resizeImageToDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('failed to read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('failed to decode image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas unavailable'))
          return
        }
        // Cover-crop: scale so the shorter side fills `size`, then center-crop the rest.
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
