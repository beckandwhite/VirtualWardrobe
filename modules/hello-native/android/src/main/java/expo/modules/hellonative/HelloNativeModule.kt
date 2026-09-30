package expo.modules.hellonative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HelloNativeModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("HelloNative")

        // Returns a greeting string — proves the native-module resolution path (M5-4).
        Function("greeting") {
            "Hello from native Android (M5-4 proof-of-concept)"
        }
    }
}
