import ExpoModulesCore

public class HelloNativeModule: Module {
    public func definition() -> ModuleDefinition {
        Name("HelloNative")

        // Returns a greeting string — proves the native-module resolution path (M5-4).
        Function("greeting") { () -> String in
            "Hello from native iOS (M5-4 proof-of-concept)"
        }
    }
}
