package cn.toside.music.mobile.userApi;

import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import java.lang.Thread;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class UserApiModule extends ReactContextBaseJavaModule {
  private final Map<String, JavaScriptThread> javaScriptThreads;
  private final ReactApplicationContext reactContext;
  private UtilsEvent utilsEvent;

  private int listenerCount = 0;

  UserApiModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.javaScriptThreads = new ConcurrentHashMap<>();
    this.utilsEvent = null;
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "UserApiModule";
  }

  @ReactMethod
  public void addListener(String eventName) {
    if (listenerCount == 0) {
      // Set up any upstream listeners or background tasks as necessary
    }

    listenerCount += 1;
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    listenerCount -= count;
    if (listenerCount == 0) {
      // Remove upstream listeners, stop unnecessary background tasks
    }
  }

  @ReactMethod
  public void loadScript(ReadableMap data) {
    if (this.utilsEvent == null) this.utilsEvent = new UtilsEvent(this.reactContext);
    Bundle info = Arguments.toBundle(data);
    if (info == null) return;
    String apiId = info.getString("id");
    if (apiId == null || apiId.isEmpty()) return;

    JavaScriptThread previousThread = this.javaScriptThreads.remove(apiId);
    if (previousThread != null) previousThread.stopThread();

    JavaScriptThread javaScriptThread = new JavaScriptThread(this.reactContext, info);
    this.javaScriptThreads.put(apiId, javaScriptThread);
    javaScriptThread.prepareHandler(new JsHandler(this.reactContext.getMainLooper(), this.utilsEvent, apiId));
    javaScriptThread.getHandler().sendEmptyMessage(HandlerWhat.INIT);
    javaScriptThread.setUncaughtExceptionHandler((thread, ex) -> {
      Handler jsHandler = javaScriptThread.getHandler();
      Message message = jsHandler.obtainMessage();
      message.what = HandlerWhat.LOG;
      message.obj = new Object[]{"error", "Uncaught exception in JavaScriptThread: " + ex.getMessage()};
      jsHandler.sendMessage(message);
      Log.e("JavaScriptThread", "Uncaught exception in JavaScriptThread: " + ex.getMessage());
    });
    Log.d("UserApi", "Module Thread id: " + Thread.currentThread().getId() + ", apiId: " + apiId);
  }

  @ReactMethod
  public boolean sendAction(String apiId, String action, String info) {
    JavaScriptThread javaScriptThread = this.javaScriptThreads.get(apiId);
    if (javaScriptThread == null) return false;
    Handler jsHandler = javaScriptThread.getHandler();
    Message message = jsHandler.obtainMessage();
    message.what = HandlerWhat.ACTION;
    message.obj = new Object[]{action, info};
    jsHandler.sendMessage(message);
    return true;
  }

  @ReactMethod
  public void destroy(String apiId) {
    JavaScriptThread javaScriptThread = this.javaScriptThreads.remove(apiId);
    if (javaScriptThread != null) javaScriptThread.stopThread();
  }

  @ReactMethod
  public void destroyAll() {
    for (JavaScriptThread javaScriptThread : this.javaScriptThreads.values()) {
      javaScriptThread.stopThread();
    }
    this.javaScriptThreads.clear();
  }
}
