import ExpoModulesCore
import Vision
import CoreImage
import UIKit

/// On-device background removal.
///
/// iOS 17+ uses Vision's `VNGenerateForegroundInstanceMaskRequest` to detect the
/// foreground subject(s), composites them against transparency, and writes a
/// transparent PNG to the caches directory. On iOS < 17, when no subject is
/// found, or on any error, the original URI is returned with `removed: false`.
/// The module never crashes for these expected conditions.
public final class VwBackgroundRemovalModule: Module {
  private let ciContext = CIContext()

  public func definition() -> ModuleDefinition {
    Name("VwBackgroundRemoval")

    AsyncFunction("removeBackground") { (uri: String, promise: Promise) in
      // Run off the main thread; Vision work is CPU/GPU heavy.
      DispatchQueue.global(qos: .userInitiated).async {
        let fallback: [String: Any] = ["uri": uri, "removed": false]

        guard #available(iOS 17.0, *) else {
          promise.resolve(fallback)
          return
        }

        do {
          let result = try self.removeBackground(uri: uri)
          promise.resolve(result)
        } catch {
          promise.resolve(fallback)
        }
      }
    }
  }

  @available(iOS 17.0, *)
  private func removeBackground(uri: String) throws -> [String: Any] {
    let fallback: [String: Any] = ["uri": uri, "removed": false]

    // Resolve the input file:// (or plain path) URI to a CIImage.
    guard let inputURL = Self.resolveURL(from: uri),
          let inputImage = CIImage(contentsOf: inputURL) else {
      return fallback
    }

    // Vision expects a CGImage / pixel handler input.
    guard let cgImage = ciContext.createCGImage(inputImage, from: inputImage.extent) else {
      return fallback
    }

    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

    try handler.perform([request])

    guard let observation = request.results?.first,
          !observation.allInstances.isEmpty else {
      // No subject detected.
      return fallback
    }

    // Union of all detected instances -> a single masked image with alpha.
    let maskedPixelBuffer = try observation.generateMaskedImage(
      ofInstances: observation.allInstances,
      from: handler,
      croppedToInstancesExtent: false
    )

    let maskedImage = CIImage(cvPixelBuffer: maskedPixelBuffer)

    // Write a transparent PNG (alpha preserved). Use a premultiplied RGBA
    // color space + format so the alpha channel survives.
    guard let outputCGImage = ciContext.createCGImage(
      maskedImage,
      from: maskedImage.extent,
      format: .RGBA8,
      colorSpace: CGColorSpaceCreateDeviceRGB()
    ) else {
      return fallback
    }

    let outputImage = UIImage(cgImage: outputCGImage)
    guard let pngData = outputImage.pngData() else {
      return fallback
    }

    let outputURL = Self.makeOutputURL()
    try pngData.write(to: outputURL, options: .atomic)

    return ["uri": outputURL.absoluteString, "removed": true]
  }

  /// Accepts `file://` URIs as well as bare filesystem paths.
  private static func resolveURL(from uri: String) -> URL? {
    if let url = URL(string: uri), url.scheme != nil {
      return url
    }
    return URL(fileURLWithPath: uri)
  }

  private static func makeOutputURL() -> URL {
    let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let filename = "vw-bg-removed-\(UUID().uuidString).png"
    return caches.appendingPathComponent(filename)
  }
}
