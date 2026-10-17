package com.openfliqlo.open_fliqlo

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun getDartEntrypointArgs(): List<String> {
        if (intent?.getBooleanExtra(EXTRA_CONFIGURE, false) == true) {
            return listOf("--configure")
        }
        return emptyList()
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            FlipClockDreamService.CHANNEL,
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "finish" -> {
                    finish()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    companion object {
        const val EXTRA_CONFIGURE = "configure"
    }
}
