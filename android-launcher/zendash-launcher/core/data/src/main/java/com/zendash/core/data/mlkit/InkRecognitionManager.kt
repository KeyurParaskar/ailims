package com.zendash.core.data.mlkit

import com.google.mlkit.vision.digitalink.DigitalInkRecognition
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModel
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModelIdentifier
import com.google.mlkit.vision.digitalink.DigitalInkRecognizer
import com.google.mlkit.vision.digitalink.DigitalInkRecognizerOptions
import com.google.mlkit.vision.digitalink.Ink
import com.google.mlkit.vision.digitalink.RecognitionResult
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Thin wrapper around Google ML Kit Digital Ink Recognition.
 *
 * Key design decisions:
 *  - Recognizer is created once per language and cached — creation is expensive.
 *  - Model download happens lazily on first [recognize] call.
 *  - All ML Kit callbacks are bridged to suspend functions via
 *    [suspendCancellableCoroutine] so callers use normal coroutine style.
 *  - The recognizer is closed and recreated when the language changes.
 *
 * Why ML Kit (not on-device ONNX/TFLite)?
 *  - ML Kit Digital Ink supports 300+ languages out of the box.
 *  - Models are downloaded and cached on-device — fully offline after first use.
 *  - API is mature and battle-tested (the same one ReZ Launcher uses).
 */
@Singleton
class InkRecognitionManager @Inject constructor() {

    private var currentLanguageTag: String = "en-US"
    private var recognizer: DigitalInkRecognizer? = null
    private var isModelReady: Boolean = false

    /**
     * Prepare the recognizer for [languageTag] (e.g. "en-US", "fr-FR").
     * Downloads the model if not already on-device.
     * Safe to call multiple times; no-ops if the language hasn't changed.
     */
    suspend fun prepare(languageTag: String = "en-US") {
        if (languageTag == currentLanguageTag && isModelReady) return

        recognizer?.close()
        recognizer = null
        isModelReady = false
        currentLanguageTag = languageTag

        val modelId = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageTag)
            ?: DigitalInkRecognitionModelIdentifier.fromLanguageTag("en-US")!!

        val model = DigitalInkRecognitionModel.builder(modelId).build()

        // Download model (no-op if already cached)
        suspendCancellableCoroutine { cont ->
            DigitalInkRecognition.getClient(
                DigitalInkRecognizerOptions.builder(model).build()
            ).also { r ->
                recognizer = r
            }
            // ML Kit downloads models lazily on first recognition call,
            // but we can explicitly trigger download to avoid latency on first scribble.
            com.google.mlkit.common.model.DownloadConditions.Builder()
                .build()
                .let { conditions ->
                    com.google.mlkit.common.model.RemoteModelManager.getInstance()
                        .download(model, conditions)
                        .addOnSuccessListener { isModelReady = true; cont.resume(Unit) }
                        .addOnFailureListener { e ->
                            // Download failed (no network) — recognizer will still work
                            // if the model was previously cached; otherwise first
                            // recognition attempt will fail gracefully.
                            isModelReady = true
                            cont.resume(Unit)
                        }
                }
        }
    }

    /**
     * Run recognition on [ink] and return the top candidates.
     *
     * Returns an empty list on failure rather than throwing — a recognition
     * failure must never crash the home screen.
     *
     * @param maxResults Maximum number of candidates to return (default 5).
     */
    suspend fun recognize(ink: Ink, maxResults: Int = 5): List<String> {
        val r = recognizer ?: return emptyList()
        return runCatching {
            suspendCancellableCoroutine { cont ->
                r.recognize(ink)
                    .addOnSuccessListener { result: RecognitionResult ->
                        val candidates = result.candidates
                            .take(maxResults)
                            .map { it.text }
                        cont.resume(candidates)
                    }
                    .addOnFailureListener { cont.resume(emptyList()) }
            }
        }.getOrDefault(emptyList())
    }

    fun close() {
        recognizer?.close()
        recognizer = null
        isModelReady = false
    }
}
