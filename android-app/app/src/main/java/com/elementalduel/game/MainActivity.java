package com.elementalduel.game;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.SharedPreferences;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import java.util.UUID;

public class MainActivity extends Activity {
    private WebView web;
    private SharedPreferences rewards;
    private boolean busy=false;
    private int request=0;
    private final Handler handler=new Handler(Looper.getMainLooper());
    // Google demo inventory only. Production IDs and consent must be configured before release.
    private static final String AD_UNIT="ca-app-pub-3940256099942544/5224354917";
    private void state(String value){if(!isDestroyed()) web.evaluateJavascript("onAdState('"+value+"')",null);}
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        rewards=getSharedPreferences("rewarded-openings",MODE_PRIVATE);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        web=new WebView(this);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){return !url.startsWith("file:///android_asset/");}
        });
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(true);
        web.addJavascriptInterface(new AdsBridge(),"AndroidAds");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }
    public class AdsBridge {
        @JavascriptInterface public String pendingReward(){return rewards.getString("pending","");}
        @JavascriptInterface public void acknowledgeReward(String token){synchronized(rewards){if(token.equals(rewards.getString("pending","")))rewards.edit().remove("pending").commit();}}
        @JavascriptInterface public void showRewarded(){runOnUiThread(()->loadRewarded());}
    }
    private void loadRewarded(){
        if(busy)return;
        if(!rewards.getString("pending","").isEmpty()){state("rewarded");return;}
        busy=true;final int current=++request;state("loading");
        handler.postDelayed(()->{if(busy&&request==current){busy=false;request++;state("failed");}},60000);
        new Thread(()->MobileAds.initialize(this,status->runOnUiThread(()->{
            if(isDestroyed()||request!=current)return;
            RewardedAd.load(this,AD_UNIT,new AdRequest.Builder().build(),new RewardedAdLoadCallback(){
                @Override public void onAdFailedToLoad(LoadAdError error){if(request!=current)return;busy=false;request++;state("failed");}
                @Override public void onAdLoaded(RewardedAd ad){
                    if(isDestroyed()||request!=current)return;
                    request++; // Loading watchdog no longer applies while viewing an ad.
                    final boolean[] earned={false};
                    ad.setFullScreenContentCallback(new FullScreenContentCallback(){
                        @Override public void onAdShowedFullScreenContent(){state("showing");}
                        @Override public void onAdDismissedFullScreenContent(){busy=false;state(earned[0]?"rewarded":"closed");}
                        @Override public void onAdFailedToShowFullScreenContent(AdError error){busy=false;state("failed");}
                    });
                    ad.show(MainActivity.this,reward->{if(!earned[0]){earned[0]=true;rewards.edit().putString("pending",UUID.randomUUID().toString()).commit();}});
                }
            });
        }))).start();
    }
    @Override protected void onDestroy(){request++;handler.removeCallbacksAndMessages(null);super.onDestroy();}
    @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}
