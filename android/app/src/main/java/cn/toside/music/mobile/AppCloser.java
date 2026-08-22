package cn.toside.music.mobile;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.guichaguri.trackplayer.service.MusicService;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * 立即停止播放服务并结束进程。
 * System.exit 无法可靠结束 TrackPlayer 前台服务，音频卸载缓冲也会继续播放数秒。
 */
public final class AppCloser {
  private static final String TAG = "AppCloser";

  private AppCloser() {}

  public static void stopPlaybackAndKill(Context context) {
    // TrackPlayer 的同步静音方法属于非稳定内部 API，不同依赖版本可能没有该成员。
    // 通过反射保持新版本的即时静音能力，同时兼容旧版本的服务停止流程。
    silencePlaybackIfSupported();

    try {
      context.stopService(new Intent(context, MusicService.class));
    } catch (Exception e) {
      Log.e(TAG, "stop MusicService failed: " + e.getMessage(), e);
    }
    android.os.Process.killProcess(android.os.Process.myPid());
    System.exit(0);
  }

  private static void silencePlaybackIfSupported() {
    try {
      Field instanceField = MusicService.class.getDeclaredField("instance");
      instanceField.setAccessible(true);
      Object service = instanceField.get(null);
      if (service == null) return;

      Method silenceMethod = MusicService.class.getDeclaredMethod("silencePlaybackSync");
      silenceMethod.setAccessible(true);
      silenceMethod.invoke(service);
    } catch (NoSuchFieldException | NoSuchMethodException e) {
      // Older TrackPlayer versions do not expose synchronous silencing.
      Log.d(TAG, "TrackPlayer synchronous silencing is unavailable");
    } catch (Exception e) {
      Log.e(TAG, "silence TrackPlayer playback failed", e);
    }
  }
}
