package cn.toside.music.mobile;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.guichaguri.trackplayer.service.MusicService;

/**
 * 立即停止播放服务并结束进程。
 * System.exit 无法可靠结束 TrackPlayer 前台服务，音频卸载缓冲也会继续播放数秒。
 */
public final class AppCloser {
  private AppCloser() {}

  public static void stopPlaybackAndKill(Context context) {
    // 先在 TrackPlayer 服务线程同步切断音频输出。直接 kill 进程会跳过
    // ExoPlayer/offload 的清理，设备音频缓冲可能在应用退出后继续播放。
    MusicService service = MusicService.instance;
    if (service != null) {
      service.silencePlaybackSync();
    }

    try {
      context.stopService(new Intent(context, MusicService.class));
    } catch (Exception e) {
      Log.e("AppCloser", "stop MusicService failed: " + e.getMessage());
    }
    android.os.Process.killProcess(android.os.Process.myPid());
    System.exit(0);
  }
}
