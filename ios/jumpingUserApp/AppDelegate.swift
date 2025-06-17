import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    // Firebase 초기화
    FirebaseApp.configure()
    
    self.moduleName = "jumpingUserApp"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    super.application(application, didFinishLaunchingWithOptions: launchOptions)
    
    // RNSplashScreen show 호출 (Objective-C 방식)
    if let splashScreenClass = NSClassFromString("RNSplashScreen") {
      _ = splashScreenClass.performSelector(onMainThread: NSSelectorFromString("show"), with: nil, waitUntilDone: false)
    }

    return true
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
