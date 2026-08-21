package cn.toside.music.mobile;

import android.content.Intent;

import com.reactnativenavigation.NavigationActivity;

public class MainActivity extends NavigationActivity {

  @Override
  public void onTaskRemoved(Intent rootIntent) {
    super.onTaskRemoved(rootIntent);
    // 从最近任务划掉应用时立刻停止播放服务并结束进程，避免音乐继续播放
    AppCloser.stopPlaybackAndKill(getApplicationContext());
  }
}
