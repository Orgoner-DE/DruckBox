package de.orgoner.stlstudio;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import java.io.OutputStream;

public class MainActivity extends Activity {
  private static final int PICK=1001, SAVE=1002;
  private WebView web;
  private ValueCallback<Uri[]> picker;
  private byte[] pending;

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    web=new WebView(this);
    web.setBackgroundColor(0xFF10151F);
    WebSettings settings=web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(true);
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params) {
        if(picker!=null) picker.onReceiveValue(null);
        picker=callback;
        try {
          Intent intent=params.createIntent();
          intent.addCategory(Intent.CATEGORY_OPENABLE);
          startActivityForResult(intent,PICK);
          return true;
        } catch(Exception ex) {
          picker=null;
          Toast.makeText(MainActivity.this,"Dateiauswahl fehlgeschlagen",Toast.LENGTH_LONG).show();
          return false;
        }
      }
    });
    web.addJavascriptInterface(new StorageBridge(),"Native");
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
  }

  private class StorageBridge {
    @JavascriptInterface public void saveFile(String name,String base64) {
      try {
        final byte[] bytes=Base64.decode(base64,Base64.DEFAULT);
        if(bytes.length>60000000) throw new Exception("Datei zu groß");
        final String safeName=name.replaceAll("[^a-zA-Z0-9_\\.\\-]","_");
        runOnUiThread(()->{
          pending=bytes;
          Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT);
          save.addCategory(Intent.CATEGORY_OPENABLE);
          save.setType("application/octet-stream");
          save.putExtra(Intent.EXTRA_TITLE,safeName);
          try{startActivityForResult(save,SAVE);}
          catch(Exception ex){pending=null;Toast.makeText(MainActivity.this,"Speicherdialog fehlt",Toast.LENGTH_SHORT).show();}
        });
      } catch(Exception ex) {
        runOnUiThread(()->Toast.makeText(MainActivity.this,"STL-Export: "+ex.getMessage(),Toast.LENGTH_LONG).show());
      }
    }
  }

  @Override protected void onActivityResult(int request,int code,Intent data) {
    super.onActivityResult(request,code,data);
    if(request==PICK){
      if(picker!=null){
        picker.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(code,data));
        picker=null;
      }
    }
    if(request==SAVE){
      if(code==RESULT_OK&&data!=null&&data.getData()!=null&&pending!=null){
        try(OutputStream stream=getContentResolver().openOutputStream(data.getData())) {
          if(stream==null)throw new Exception("Kein Schreibzugriff");
          stream.write(pending);
          stream.flush();
          Toast.makeText(this,"STL gespeichert",Toast.LENGTH_SHORT).show();
        }catch(Exception ex){Toast.makeText(this,"Export fehlgeschlagen: "+ex.getMessage(),Toast.LENGTH_LONG).show();}
      }
      pending=null;
    }
  }
  @Override protected void onDestroy(){if(web!=null)web.destroy();super.onDestroy();}
}