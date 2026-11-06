declare module '@zxing/browser' {
  export class BrowserMultiFormatReader {
    static listVideoInputDevices(): Promise<MediaDeviceInfo[]>
    decodeFromVideoDevice(
      deviceId: string | undefined,
      videoElement: HTMLVideoElement,
      callback: (result: any, error?: any) => void,
    ): Promise<{ stop: () => void }>
  }
}

declare module 'jsbarcode' {
  function JsBarcode(element: any, data: string, options?: Record<string, any>): void
  export default JsBarcode
}

