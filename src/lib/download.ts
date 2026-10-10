export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'banner.png'): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false)
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      // 클릭 직후 해제하면 일부 브라우저에서 다운로드가 취소되므로 한 틱 미룬다
      setTimeout(() => URL.revokeObjectURL(url), 0)
      resolve(true)
    }, 'image/png')
  })
}
