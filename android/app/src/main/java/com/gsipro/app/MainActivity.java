package com.gsipro.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this);
                Log.d("GSI_PRO", "FirebaseApp inicializado com sucesso antes do super.onCreate");
            }
        } catch (Throwable t) {
            Log.e("GSI_PRO", "Aviso na inicialização do Firebase: " + t.getMessage(), t);
        }
        super.onCreate(savedInstanceState);
    }
}
