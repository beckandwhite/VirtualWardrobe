package expo.modules.vwbackgroundremoval

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import com.google.android.gms.tasks.Tasks
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

/**
 * On-device background removal using ML Kit Subject Segmentation
 * (`com.google.mlkit:segmentation-subject`).
 *
 * On success it composites the detected foreground subject(s) into a transparent
 * PNG written to the app cache dir and returns `{ uri, removed: true }`. When no
 * subject is found, the segmentation model has not been downloaded yet, or any
 * error occurs, it returns the original `{ uri, removed: false }`. Requires
 * Android API 24+ (enforced by the module's minSdk). Never crashes.
 */
class VwBackgroundRemovalModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VwBackgroundRemoval")

    AsyncFunction("removeBackground") { uri: String, promise: Promise ->
      // AsyncFunction dispatches off the JS thread; ML Kit work is safe here.
      val fallback = mapOf("uri" to uri, "removed" to false)
      try {
        val result = removeBackground(uri)
        promise.resolve(result)
      } catch (e: Throwable) {
        promise.resolve(fallback)
      }
    }
  }

  private fun removeBackground(uri: String): Map<String, Any> {
    val fallback = mapOf("uri" to uri, "removed" to false)

    val inputFile = resolveFile(uri) ?: return fallback
    val bitmap = BitmapFactory.decodeFile(inputFile.absolutePath) ?: return fallback

    // Request the foreground confidence mask + a ready-made foreground bitmap.
    val options = SubjectSegmenterOptions.Builder()
      .enableForegroundBitmap()
      .build()

    val segmenter = SubjectSegmentation.getClient(options)

    // Bridge ML Kit's Task API to this synchronous helper. `Tasks.await`
    // throws if the model still needs downloading, which we treat as a
    // graceful fallback.
    val image = com.google.mlkit.vision.common.InputImage.fromBitmap(bitmap, 0)
    val segmentationResult = try {
      Tasks.await(segmenter.process(image))
    } catch (e: Throwable) {
      segmenter.close()
      return fallback
    }

    // `foregroundBitmap` is an ARGB_8888 bitmap with transparent background
    // (union of all detected subjects). Null when no subject was found.
    val foreground = segmentationResult.foregroundBitmap
    segmenter.close()
    if (foreground == null) {
      return fallback
    }

    val outputFile = makeOutputFile()
    FileOutputStream(outputFile).use { out ->
      // PNG preserves the alpha channel; do NOT use JPEG here.
      foreground.compress(Bitmap.CompressFormat.PNG, 100, out)
    }

    return mapOf("uri" to Uri.fromFile(outputFile).toString(), "removed" to true)
  }

  /** Accepts `file://` URIs as well as bare filesystem paths. */
  private fun resolveFile(uri: String): File? {
    return try {
      val parsed = Uri.parse(uri)
      val path = if (parsed.scheme == "file") parsed.path else uri
      if (path.isNullOrEmpty()) null else File(path)
    } catch (e: Throwable) {
      null
    }
  }

  private fun makeOutputFile(): File {
    val cacheDir = appContext.reactContext?.cacheDir
      ?: appContext.cacheDirectory
    return File(cacheDir, "vw-bg-removed-${UUID.randomUUID()}.png")
  }
}
