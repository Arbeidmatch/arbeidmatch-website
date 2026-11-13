package no.arbeidmatch.forsprang;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityManager;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.window.OnBackInvokedDispatcher;

import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import java.util.List;

/**
 * Forsprang: Min side in a window that belongs to the app.
 *
 * The owner's rules of 13 November 2026, and what each line below is for:
 *   - no screenshot and no screen recording of the app (FLAG_SECURE: the
 *     capture comes out black, and the recent-apps preview is blank);
 *   - no agent reading the screen: on Android 14 and later the content is
 *     marked sensitive, so only real tools for blind users (TalkBack and the
 *     like, isAccessibilityTool) can read it; on Android 12 and later an
 *     enabled reader that is not such a tool hides the projects until it is
 *     switched off;
 *   - nothing copied off the phone: no backup (manifest), no WebView
 *     debugging, no file access from the page.
 * The project data itself never lives on the phone: Min side loads it from
 * the server on every visit.
 */
public class MainActivity extends Activity {

    static final String HOST = "www.arbeidmatch.no";
    static final String START = "https://" + HOST + "/min-side";
    private static final int FILE_REQUEST = 7;

    private FrameLayout root;
    private WebView web;
    private View cover;
    private ValueCallback<Uri[]> pendingFiles;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            setRecentsScreenshotEnabled(false);
        }
        WebView.setWebContentsDebuggingEnabled(false);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#0D1B2A"));
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        if (Build.VERSION.SDK_INT >= 34) {
            web.setAccessibilityDataSensitive(View.ACCESSIBILITY_DATA_SENSITIVE_YES);
        }
        configure(web);

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
        }

        String target = allowedUrl(getIntent());
        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(target != null ? target : START);
        }
    }

    private void configure(WebView view) {
        WebSettings s = view.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString() + " ForsprangApp/" + BuildConfigVersion.NAME);
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebSettingsCompat.setSafeBrowsingEnabled(s, true);
        }
        // Passkeys ("Logg inn med fingeren") inside the app, where the WebView supports them.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_AUTHENTICATION)) {
            WebSettingsCompat.setWebAuthenticationSupport(s, WebSettingsCompat.WEB_AUTHENTICATION_SUPPORT_FOR_APP);
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(view, false);

        view.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isOurs(uri)) return false;
                openOutside(uri);
                return true;
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOffline();
            }
        });

        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFiles != null) pendingFiles.onReceiveValue(null);
                pendingFiles = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_REQUEST);
                } catch (ActivityNotFoundException e) {
                    pendingFiles = null;
                    return false;
                }
                return true;
            }
        });

        // Files the page offers (an export, a signed document) open outside, by their own link.
        view.setDownloadListener((url, userAgent, contentDisposition, mimeType, length) -> openOutside(Uri.parse(url)));
    }

    static boolean isOurs(Uri uri) {
        if (uri == null || !"https".equals(uri.getScheme())) return false;
        String host = uri.getHost();
        return HOST.equals(host) || "arbeidmatch.no".equals(host);
    }

    private static String allowedUrl(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return null;
        Uri data = intent.getData();
        return isOurs(data) ? data.toString() : null;
    }

    private void openOutside(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException ignored) {
            // Nothing on the phone can open it; stay where we are.
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String target = allowedUrl(intent);
        if (target != null) web.loadUrl(target);
    }

    @Override
    protected void onResume() {
        super.onResume();
        String reader = unapprovedReader();
        if (debuggingOn()) showDebugCover();
        else if (reader != null) showReaderCover(reader);
        else hideCover();
    }

    @Override
    protected void onPause() {
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        goBack();
    }

    private void goBack() {
        if (cover == null && web.canGoBack()) web.goBack();
        else finish();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_REQUEST && pendingFiles != null) {
            pendingFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            pendingFiles = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /**
     * The name of an enabled accessibility service that is not a tool for
     * people with a disability, or null. Android 12 is where a service can say
     * it is such a tool; below that nothing can tell them apart, and blocking
     * would lock out blind users, so older phones rely on FLAG_SECURE alone.
     */
    private String unapprovedReader() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return null;
        AccessibilityManager manager = (AccessibilityManager) getSystemService(ACCESSIBILITY_SERVICE);
        if (manager == null || !manager.isEnabled()) return null;
        List<AccessibilityServiceInfo> services = manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
        for (AccessibilityServiceInfo info : services) {
            if (info.isAccessibilityTool()) continue;
            if (isSystemApp(info.getResolveInfo())) continue;
            CharSequence label = info.getResolveInfo() != null ? info.getResolveInfo().loadLabel(getPackageManager()) : null;
            return label != null ? label.toString() : "skjermleseren";
        }
        return null;
    }

    /**
     * USB or wireless debugging lets a computer, or an agent on it, read the
     * screen's text and drive the app over adb, past every check above. Banks
     * refuse to open then; so does this. Only developers have it switched on.
     */
    private boolean debuggingOn() {
        try {
            if (Settings.Global.getInt(getContentResolver(), Settings.Global.ADB_ENABLED, 0) == 1) return true;
            return Settings.Global.getInt(getContentResolver(), "adb_wifi_enabled", 0) == 1;
        } catch (Exception e) {
            return false;
        }
    }

    private void showDebugCover() {
        showCover(getString(R.string.debug_title), getString(R.string.debug_body), getString(R.string.open_settings),
                v -> startActivity(new Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)));
        web.setVisibility(View.INVISIBLE);
    }

    private static boolean isSystemApp(ResolveInfo info) {
        if (info == null || info.serviceInfo == null || info.serviceInfo.applicationInfo == null) return false;
        return (info.serviceInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
    }

    private void showReaderCover(String name) {
        showCover(getString(R.string.reader_title, name), getString(R.string.reader_body), getString(R.string.open_settings),
                v -> startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)));
        web.setVisibility(View.INVISIBLE);
    }

    private void showOffline() {
        showCover(getString(R.string.offline_title), getString(R.string.offline_body), getString(R.string.retry), v -> {
            hideCover();
            web.reload();
        });
    }

    private void showCover(String title, String body, String action, View.OnClickListener onClick) {
        hideCover();
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setBackgroundColor(Color.parseColor("#F2F2F7"));
        int pad = dp(28);
        box.setPadding(pad, pad, pad, pad);

        TextView t = new TextView(this);
        t.setText(title);
        t.setTextSize(22);
        t.setTextColor(Color.parseColor("#1B2B44"));
        t.setGravity(Gravity.CENTER);
        t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        box.addView(t);

        TextView b = new TextView(this);
        b.setText(body);
        b.setTextSize(17);
        b.setTextColor(Color.parseColor("#4A5568"));
        b.setGravity(Gravity.CENTER);
        b.setPadding(0, dp(12), 0, dp(24));
        box.addView(b);

        Button button = new Button(this);
        button.setText(action);
        button.setAllCaps(false);
        button.setTextSize(17);
        button.setTextColor(Color.WHITE);
        button.setBackgroundColor(Color.parseColor("#1B2B44"));
        button.setMinHeight(dp(56));
        button.setOnClickListener(onClick);
        box.addView(button, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        cover = box;
        root.addView(cover, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void hideCover() {
        if (cover != null) {
            root.removeView(cover);
            cover = null;
        }
        web.setVisibility(View.VISIBLE);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
