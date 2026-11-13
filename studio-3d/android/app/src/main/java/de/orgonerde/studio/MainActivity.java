package de.orgonerde.studio;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int PICK_FILE = 4101;
    private static final int SAVE_FILE = 4102;
    private static final int MAX_EXPORT_BYTES = 24 * 1024 * 1024;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private ByteArrayOutputStream staged;
    private String filename="2H4Y_model.stl", mime="application/octet-stream";
    private byte[] pendingExport;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(0xff0d1018);
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.addJavascriptInterface(new ExportBridge(),"Native");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url=request.getUrl();
                if("https".equals(url.getScheme()) && "appassets.androidplatform.net".equals(url.getHost())) return false;
                // External release links are opened by Android's browser, not inside the privileged WebView.
                if("https".equals(url.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW,url)); } catch(Exception ignored){}
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=callback;
                Intent pick=new Intent(Intent.ACTION_GET_CONTENT);
                pick.setType("*/*");
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                try{startActivityForResult(Intent.createChooser(pick,"Bild oder 3D-Datei auswählen"),PICK_FILE);}
                catch(Exception error){fileCallback.onReceiveValue(null);fileCallback=null;return false;}
                return true;
            }
        });
        try(InputStream in=getAssets().open("index.html")){
            byte[] content=readAll(in);
            web.loadDataWithBaseURL("https://appassets.androidplatform.net/",new String(content,StandardCharsets.UTF_8),"text/html","UTF-8",null);
        }catch(Exception e){web.loadData("<h1>Die App-Dateien fehlen.</h1>","text/html","UTF-8");}
    }
    private static byte[] readAll(InputStream in)throws Exception {
        ByteArrayOutputStream b=new ByteArrayOutputStream();byte[] v=new byte[8192];int n;
        while((n=in.read(v))!=-1)b.write(v,0,n);
        return b.toByteArray();
    }
    public class ExportBridge {
        @JavascriptInterface public synchronized void beginExport(String file,String type) {
            filename=(file==null?"2H4Y_model.stl":file).replaceAll("[^a-zA-Z0-9_.-]","_");
            mime=type!=null&&type.startsWith("text/")?"text/plain":"application/octet-stream";
            staged=new ByteArrayOutputStream();
        }
        @JavascriptInterface public synchronized void exportChunk(String chunk) {
            if(staged==null)return;
            byte[] decoded=Base64.decode(chunk,Base64.DEFAULT);
            if(staged.size()+decoded.length>MAX_EXPORT_BYTES){staged=null;return;}
            staged.write(decoded,0,decoded.length);
        }
        @JavascriptInterface public void openUrl(String raw) {
            try {
                Uri uri=Uri.parse(raw);
                if(!"https".equalsIgnoreCase(uri.getScheme()))return;
                runOnUiThread(()->{try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}});
            }catch(Exception ignored){}
        }
        @JavascriptInterface public synchronized void finishExport() {
            if(staged==null||staged.size()==0)return;
            pendingExport=staged.toByteArray();staged=null;
            runOnUiThread(()->{
                Intent create=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                create.addCategory(Intent.CATEGORY_OPENABLE);create.setType(mime);
                create.putExtra(Intent.EXTRA_TITLE,filename);
                try{startActivityForResult(create,SAVE_FILE);}catch(Exception e){pendingExport=null;}
            });
        }
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==PICK_FILE){
            if(fileCallback!=null){fileCallback.onReceiveValue(resultCode==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}
        }else if(requestCode==SAVE_FILE){
            byte[] bytes=pendingExport;pendingExport=null;
            if(resultCode==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){
                try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out!=null)out.write(bytes);}catch(Exception ignored){}
            }
        }
    }
    @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(web!=null)web.destroy();super.onDestroy();}
}
